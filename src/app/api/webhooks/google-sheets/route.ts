import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'The AI Bridge Google Sheets Sync Webhook is online and ready.',
    timestamp: new Date().toISOString()
  });
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
        
        // Find existing profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', normalizedEmail)
          .maybeSingle();

        const payload = {
          user_id: profile?.id || null,
          respondent_email: normalizedEmail,
          survey_type: row.survey_type || survey_type,
          answers: row.answers || {},
          hours_saved_estimate: Number(row.hours_saved_estimate) || 0,
          comprehension_self_rating: Number(row.comprehension_self_rating) || 3,
          feedback_notes: row.feedback_notes || null,
          sheet_row_number: row.sheet_row_number || null,
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
        message: `Successfully synchronized ${syncedCount} rows to Supabase with audit logging.`
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
    const performer = performed_by || normalizedEmail;

    // 3. Resolve user_id if already registered in profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    const userId = profile?.id || null;

    // 4. Execute Action
    if (action === 'INSERT') {
      const payload = {
        user_id: userId,
        respondent_email: normalizedEmail,
        survey_type,
        answers: answers || {},
        hours_saved_estimate: Number(hours_saved_estimate) || 0,
        comprehension_self_rating: Number(comprehension_self_rating) || 3,
        feedback_notes: feedback_notes || null,
        sheet_row_number: sheet_row_number || null,
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
        message: `Survey registered for ${normalizedEmail}. Step assessment is now unlocked.`,
        survey_id: data?.id,
        user_id: userId
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
        survey_id: resultSurveyId
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
