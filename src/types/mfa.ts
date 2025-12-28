export interface MFAFactor {
  id: string;
  factor_type: "totp";
  status: "verified" | "unverified";
  created_at: string;
  updated_at: string;
}

export interface MFAEnrollResponse {
  id: string;
  type: "totp";
  totp: {
    qr_code: string;
    secret: string;
    uri: string;
  };
}

export interface MFAChallenge {
  id: string;
  type: "totp";
  expires_at: number;
}

export interface MFAVerifyParams {
  factorId: string;
  challengeId: string;
  code: string;
}

export interface BackupCode {
  code: string;
  used: boolean;
}

export type MFAStatus = "not_enrolled" | "enrolling" | "enrolled" | "verifying";
