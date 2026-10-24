import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stampCertificatePdfOnTheSpot, stampCertificatePngOnTheSpot } from '@/lib/certificate/generator';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const searchParams = req.nextUrl.searchParams;
    const verifyId = searchParams.get('verify_id')?.trim();
    const format = searchParams.get('format')?.toLowerCase();

    let cert: any = null;

    // 1. Mode A: Public Download via Verified ID (from /verify/[id] page)
    if (verifyId) {
      const cleanSuffix = verifyId.replace(/^AIB-/i, '').trim();
      const { data: verifiedCert, error: verifyErr } = await adminClient
        .from('certificates')
        .select('*')
        .or(`certificate_id.ilike.${verifyId},certificate_id.ilike.AIB-${cleanSuffix},certificate_id.ilike.%${cleanSuffix}%,verification_code.ilike.${verifyId}`)
        .maybeSingle();

      if (verifyErr || !verifiedCert) {
        return NextResponse.json(
          { error: 'Valid certificate not found for ID: ' + verifyId },
          { status: 404 }
        );
      }

      if (!verifiedCert.is_valid) {
        return NextResponse.json(
          { error: 'This certificate has been revoked by administration.' },
          { status: 403 }
        );
      }

      cert = verifiedCert;
    } 
    // 2. Mode B: Authenticated Student Portal Download
    else {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized. Please log in to download your certificate.' },
          { status: 401 }
        );
      }

      // Check if certificate record exists for user
      const { data: userCert } = await adminClient
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!userCert) {
        // Self-heal: attempt to evaluate 3 gates and issue certificate
        let issueResult: any = null;
        let issueErr: any = null;

        const adminRpcRes = await adminClient.rpc(
          'issue_certificate_for_user',
          { p_user_id: user.id }
        );
        issueResult = adminRpcRes.data;
        issueErr = adminRpcRes.error;

        // Safety fallback: if admin client encounters any permission or network error, use user session
        if (issueErr) {
          console.warn('Admin RPC error, trying authenticated user client fallback:', issueErr);
          const userRpcRes = await supabase.rpc(
            'issue_certificate_for_user',
            { p_user_id: user.id }
          );
          issueResult = userRpcRes.data;
          issueErr = userRpcRes.error;
        }

        if (issueErr) {
          console.error('Certificate issuance RPC error:', issueErr);
          return NextResponse.json(
            { error: 'Failed to verify evaluation gates: ' + issueErr.message },
            { status: 500 }
          );
        }

        if (!issueResult?.success) {
          return NextResponse.json(
            {
              error: issueResult?.error || 'All 3 evaluation gates must be completed to unlock your certificate.',
              gates: issueResult?.gates,
            },
            { status: 400 }
          );
        }

        cert = issueResult.certificate;
      } else {
        cert = userCert;
      }

      if (!cert.is_valid) {
        return NextResponse.json(
          { error: 'This certificate has been revoked by administration.' },
          { status: 403 }
        );
      }
    }

    const recipientName = cert.recipient_name || cert.student_name || 'Participant';

    // 3. Format Branch: High-Resolution PNG
    if (format === 'png') {
      const pngBytes = await stampCertificatePngOnTheSpot({
        certificateId: cert.certificate_id,
        recipientName,
      });

      const safeFilename = `The_AI_Bridge_Certificate_${cert.certificate_id.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;

      return new NextResponse(Buffer.from(pngBytes), {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="${safeFilename}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    // 4. Default Format: Stamped Vector PDF on the spot in RAM (~50-80ms)
    const pdfBytes = await stampCertificatePdfOnTheSpot({
      certificateId: cert.certificate_id,
      recipientName,
    });

    const safeFilename = `The_AI_Bridge_Certificate_${cert.certificate_id.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    // Stream binary directly to user (Zero file storage)
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err: any) {
    console.error('Certificate generation error:', err);
    return NextResponse.json(
      { error: 'Server error generating certificate: ' + (err.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
