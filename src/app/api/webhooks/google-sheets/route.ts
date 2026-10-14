import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'The AI Bridge Google Sheets Sync Webhook is online and ready.',
    timestamp: new Date().toISOString()
  });
}

/**
 * Extracts student semester, department code, and registration number from institutional email.
 * - Type 1: [Reg][Dept][Semester]@student.iiu.edu.pk (e.g. 025580bsirf26)
 * - Type 2: [Name].[Dept][Reg]@student.iiu.edu.pk (e.g. zain.bsba126)
 * - Fallback: For Type 2, searches the form roll number answer for season+year (e.g. F23, S24).
 */
function parseStudentEmail(rawEmail: string, fallbackRoll?: string): {
  regNo: string;
  deptCode: string;
  semester: string;
} {
  if (!rawEmail) return { regNo: '', deptCode: '', semester: '' };

  const clean = rawEmail.replace(/\s+/g, '').toLowerCase();
  const userPart = clean.split('@')[0];

  // Type 1: Modern Format [Reg][Dept][Semester] e.g. 025580bsirf26
  const matchStd = userPart.match(/^(\d+)[/_]?([a-z]+?)([fs]\d{2})$/);
  if (matchStd) {
    return {
      regNo: matchStd[1],
      deptCode: matchStd[2].toUpperCase(),
      semester: matchStd[3].toUpperCase() // e.g. F26
    };
  }

  // Type 2: Older / Senior Format [Name].[Dept][Reg] e.g. zain.bsba126
  const matchName = userPart.match(/^[a-z]+\.([a-z]+?)(\d+)$/);
  if (matchName) {
    const deptCode = matchName[1].toUpperCase();
    const regNo = matchName[2];
    let semester = '';

    // "Via Fallback": Check messy roll number from form answers for season+year
    if (fallbackRoll) {
      const matchRollSem = fallbackRoll.match(/([fsFS][-_\s]?\d{2})/);
      if (matchRollSem) {
        semester = matchRollSem[1].replace(/[-_\s]/g, '').toUpperCase();
      }
    }

    return {
      regNo,
      deptCode,
      semester: semester || 'UNKNOWN'
    };
  }

  // Type 1 Fallback search across string (e.g. if extra text typed around it)
  const matchSearch = clean.match(/(\d{4,6})[/\-_]?([a-z]+?)([fs]\d{2})/);
  if (matchSearch) {
    return {
      regNo: matchSearch[1],
      deptCode: matchSearch[2].toUpperCase(),
      semester: matchSearch[3].toUpperCase()
    };
  }

  return { regNo: '', deptCode: '', semester: '' };
}

function extractFallbackRoll(answers: Record<string, any>): string {
  if (!answers || typeof answers !== 'object') return '';
  for (const [key, val] of Object.entries(answers)) {
    const k = key.toLowerCase();
    if (k.includes('roll') || k.includes('reg') || k.includes('registration')) {
      return String(val || '');
    }
  }
  return '';
}

/**
 * Ensures the extracted department code exists in department_mappings so foreign key constraints hold.
 * If new, creates it with "Pending Review" status for the Admin to configure in the Dashboard.
 */
async function ensureDepartmentMappingExists(supabase: any, deptCode: string) {
  if (!deptCode) return;
  try {
    const cleanCode = deptCode.toUpperCase();
    await supabase.from('department_mappings').upsert(
      {
        code: cleanCode,
        standard_dept_name: cleanCode,
        faculty_name: 'Pending Assignment',
        updated_at: new Date().toISOString()
      },
      { onConflict: 'code', ignoreDuplicates: true }
    );
  } catch (err) {
    // Non-fatal, continue sync even if mapping table is pending migration
    console.error(`ensureDepartmentMappingExists error for ${deptCode}:`, err);
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Secret Token (if configured in environment)
    const expectedSecret = process.env.SHEETS_WEBHOOK_SECRET;
    if (expectedSecret) {
      const authHeader = req.headers.get('authorization') || '';
      const secretHeader = req.headers.get('x-webhook-secret') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '') || secretHeader;

      if (token !== expectedSecret) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid or missing webhook secret' },
          { status: 401 }
        );
      }
    }

    const body = await req.json();
    const { 
      action = 'INSERT', 
      survey_type = 'pre', 
      email, 
      performed_by, 
      sheet_row_number, 
      hours_saved_estimate = 0, 
      comprehension_self_rating = 3, 
      feedback_notes = '', 
      answers = {},
      rows = []
    } = body;

    const supabase = createAdminClient();

    // 2. Handle Bulk Sync (SYNC_ALL)
    if (action === 'SYNC_ALL' && Array.isArray(rows)) {
      let syncedCount = 0;
      for (const row of rows) {
        if (!row.email) continue;
        const normalizedEmail = row.email.trim().toLowerCase();
        
        // Parse email to derive 3 distinct columns
        const fallbackRoll = extractFallbackRoll(row.answers || {});
        const { regNo, deptCode, semester } = parseStudentEmail(normalizedEmail, fallbackRoll);
        
        if (deptCode) {
          await ensureDepartmentMappingExists(supabase, deptCode);
        }

        // Find existing profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', normalizedEmail)
          .maybeSingle();

        const payload: Record<string, any> = {
          user_id: profile?.id || null,
          respondent_email: normalizedEmail,
          survey_type: row.survey_type || survey_type,
          answers: row.answers || {},
          hours_saved_estimate: Number(row.hours_saved_estimate) || 0,
          comprehension_self_rating: Number(row.comprehension_self_rating) || 3,
          feedback_notes: row.feedback_notes || null,
          sheet_row_number: row.sheet_row_number || null,
          extracted_reg_no: row.extracted_reg_no || regNo || null,
          extracted_dept_code: row.extracted_dept_code || deptCode || null,
          extracted_semester: row.extracted_semester || semester || null,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('surveys')
          .upsert(payload, { onConflict: 'respondent_email,survey_type' });

        if (!error) syncedCount++;
      }

      return NextResponse.json({
        success: true,
        action: 'SYNC_ALL',
        rows_processed: rows.length,
        synced_count: syncedCount,
        message: `Successfully synchronized ${syncedCount} rows to Supabase with automatic email-to-department parsing.`
      });
    }

    // Single item operations require email
    if (!email) {
      return NextResponse.json(
        { error: 'Missing required field: email' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const fallbackRoll = extractFallbackRoll(answers || {});
    const { regNo, deptCode, semester } = parseStudentEmail(normalizedEmail, fallbackRoll);

    if (deptCode) {
      await ensureDepartmentMappingExists(supabase, deptCode);
    }

    // 3. Resolve user_id if already registered in profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    const userId = profile?.id || null;

    // 4. Execute Action
    if (action === 'INSERT') {
      const payload: Record<string, any> = {
        user_id: userId,
        respondent_email: normalizedEmail,
        survey_type,
        answers: answers || {},
        hours_saved_estimate: Number(hours_saved_estimate) || 0,
        comprehension_self_rating: Number(comprehension_self_rating) || 3,
        feedback_notes: feedback_notes || null,
        sheet_row_number: sheet_row_number || null,
        extracted_reg_no: body.extracted_reg_no || regNo || null,
        extracted_dept_code: body.extracted_dept_code || deptCode || null,
        extracted_semester: body.extracted_semester || semester || null,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Upsert: handles if already exists without throwing unique constraint error
      const { data, error } = await supabase
        .from('surveys')
        .upsert(payload, { onConflict: 'respondent_email,survey_type' })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        action: 'INSERT',
        message: `Survey registered for ${normalizedEmail}. Extracted: Dept ${deptCode || 'N/A'}, Sem ${semester || 'N/A'}, Reg ${regNo || 'N/A'}.`,
        survey_id: data?.id,
        user_id: userId,
        extracted: { regNo, deptCode, semester }
      });
    }

    if (action === 'UPDATE') {
      // Find existing record
      const { data: existingSurvey } = await supabase
        .from('surveys')
        .select('id')
        .eq('respondent_email', normalizedEmail)
        .eq('survey_type', survey_type)
        .maybeSingle();

      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
        extracted_reg_no: body.extracted_reg_no || regNo || null,
        extracted_dept_code: body.extracted_dept_code || deptCode || null,
        extracted_semester: body.extracted_semester || semester || null,
      };

      if (hours_saved_estimate !== undefined) updateData.hours_saved_estimate = Number(hours_saved_estimate);
      if (comprehension_self_rating !== undefined) updateData.comprehension_self_rating = Number(comprehension_self_rating);
      if (feedback_notes !== undefined) updateData.feedback_notes = feedback_notes;
      if (answers && Object.keys(answers).length > 0) updateData.answers = answers;
      if (sheet_row_number !== undefined) updateData.sheet_row_number = sheet_row_number;
      if (userId) updateData.user_id = userId;

      let resultSurveyId = existingSurvey?.id;

      if (existingSurvey) {
        const { error: updateError } = await supabase
          .from('surveys')
          .update(updateData)
          .eq('id', existingSurvey.id);

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 400 });
        }
      } else {
        // If not found, insert as new
        const { data: inserted, error: insertError } = await supabase
          .from('surveys')
          .insert({
            user_id: userId,
            respondent_email: normalizedEmail,
            survey_type,
            answers: answers || {},
            hours_saved_estimate: Number(hours_saved_estimate) || 0,
            comprehension_self_rating: Number(comprehension_self_rating) || 3,
            feedback_notes: feedback_notes || null,
            sheet_row_number: sheet_row_number || null,
            extracted_reg_no: regNo || null,
            extracted_dept_code: deptCode || null,
            extracted_semester: semester || null,
          })
          .select()
          .single();

        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 400 });
        }
        resultSurveyId = inserted?.id;
      }

      return NextResponse.json({
        success: true,
        action: 'UPDATE',
        message: `Survey updated for ${normalizedEmail}. Audit log recorded.`,
        survey_id: resultSurveyId,
        extracted: { regNo, deptCode, semester }
      });
    }

    if (action === 'DELETE') {
      // Retrieve before delete so we know what was deleted
      const { data: existingSurvey } = await supabase
        .from('surveys')
        .select('*')
        .eq('respondent_email', normalizedEmail)
        .eq('survey_type', survey_type)
        .maybeSingle();

      if (!existingSurvey) {
        return NextResponse.json({
          success: true,
          action: 'DELETE',
          message: `No active survey found for ${normalizedEmail} with type ${survey_type}.`
        });
      }

      const { error: deleteError } = await supabase
        .from('surveys')
        .delete()
        .eq('id', existingSurvey.id);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        action: 'DELETE',
        message: `Survey deleted for ${normalizedEmail}. User progression reset and logged to audit table.`
      });
    }

    return NextResponse.json(
      { error: `Unsupported action '${action}'. Valid actions: INSERT, UPDATE, DELETE, SYNC_ALL` },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error processing webhook' },
      { status: 500 }
    );
  }
}
