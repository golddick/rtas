// lib/otp/client.ts

interface SendOTPParams {
  email: string;
  length?: number;
  expiry?: number;
  brandName?: string;
  metadata?: Record<string, any>;
}

interface SendOTPResponse {
  success: boolean;
  data?: {
    id: string;
    expiresAt: string;
  };
  error?: string;
}

const DROPAPHI_BASE_URL = process.env.NEXT_PUBLIC_DROPAPHI_URL || 'https://dropaphi.vercel.app/api/v1'
const DROPAPHI_KEY =  process.env.NEXT_PUBLIC_DROPAPHI_KEY || 'da_test__dtHFb0DfG';

export async function sendOTP({
  email,
  length = 6,
  expiry = 10,
  brandName = 'RTAS',
  metadata = {},
}: SendOTPParams): Promise<SendOTPResponse> {
  try {
    const response = await fetch(`${DROPAPHI_BASE_URL}/otp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': DROPAPHI_KEY || '',
      },
      body: JSON.stringify({
        email,
        length,
        expiry,
        brandName,
        metadata,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to send OTP',
      };
    }

    return {
      success: true,
      data: {
        id: result.data.id,
        expiresAt: result.data.expiresAt,
      },
    };
  } catch (error) {
    console.error('[SEND_OTP_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send OTP',
    };
  }
}

export async function verifyOTP({
  email,
  code,
  otpId,
}: {
  email: string;
  code: string;
  otpId?: string;
}) {
  try {
    const response = await fetch(`${DROPAPHI_BASE_URL}/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': DROPAPHI_KEY || '',
      },
      body: JSON.stringify({
        email,
        code,
        id: otpId,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to verify OTP',
        attemptsRemaining: result.attemptsRemaining,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('[VERIFY_OTP_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify OTP',
    };
  }
}

export async function resendOTP({
  email,
  otpId,
  reason = 'not_received',
  metadata = {},
}: {
  email: string;
  otpId?: string;
  reason?: 'expired' | 'not_received' | 'new_request';
  metadata?: Record<string, any>;
}) {
  try {
    const response = await fetch(`${DROPAPHI_BASE_URL}/otp/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': DROPAPHI_KEY || '',
      },
      body: JSON.stringify({
        email,
        otpId,
        reason,
        brandName: 'RTAS',
        metadata,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to resend OTP',
      };
    }

    return {
      success: true,
      data: {
        id: result.data.id,
        expiresAt: result.data.expiresAt,
      },
    };
  } catch (error) {
    console.error('[RESEND_OTP_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resend OTP',
    };
  }
}