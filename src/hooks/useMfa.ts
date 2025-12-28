import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type {
  MFAEnrollResponse,
  MFAChallenge,
  MFAFactor,
  MFAStatus,
} from "../types/mfa";

export const useMFA = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaStatus, setMfaStatus] = useState<MFAStatus>("not_enrolled");
  console.log(loading);

  // Enroll in MFA
  const enrollMFA = useCallback(async (): Promise<MFAEnrollResponse | null> => {
    setLoading(true);

    setError(null);
    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

      if (enrollError) throw enrollError;

      setMfaStatus("enrolling");
      setLoading(false);

      return data as MFAEnrollResponse;
    } catch (err: any) {
      setError(err.message || "Failed to enroll in MFA");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Verify MFA enrollment
  const verifyEnrollment = useCallback(
    async (factorId: string, code: string): Promise<boolean> => {
      setLoading(true);

      setError(null);
      try {
        const challenge = await supabase.auth.mfa.challenge({ factorId });
        if (challenge.error) throw challenge.error;

        const verify = await supabase.auth.mfa.verify({
          factorId,
          challengeId: challenge.data.id,
          code,
        });

        if (verify.error) throw verify.error;

        setMfaStatus("enrolled");
        return true;
      } catch (err: any) {
        setError(err.message || "Invalid verification code");
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Create MFA challenge for login
  const createChallenge = useCallback(
    async (factorId: string): Promise<MFAChallenge | null> => {
      setLoading(true);

      setError(null);
      try {
        const { data, error: challengeError } =
          await supabase.auth.mfa.challenge({
            factorId,
          });

        if (challengeError) throw challengeError;

        setMfaStatus("verifying");
        return data as MFAChallenge;
      } catch (err: any) {
        setError(err.message || "Failed to create challenge");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Verify MFA code during login
  const verifyChallenge = useCallback(
    async (
      factorId: string,
      challengeId: string,
      code: string
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId,
          challengeId,
          code,
        });

        if (verifyError) throw verifyError;

        setMfaStatus("enrolled");
        return true;
      } catch (err: any) {
        setError(err.message || "Invalid verification code");
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Unenroll from MFA
  const unenrollMFA = useCallback(
    async (factorId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const { error: unenrollError } = await supabase.auth.mfa.unenroll({
          factorId,
        });

        if (unenrollError) throw unenrollError;

        setMfaStatus("not_enrolled");
        return true;
      } catch (err: any) {
        setError(err.message || "Failed to disable MFA");
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get all MFA factors
  // In your custom hook, make sure dependencies are correct
  const getFactors = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No active session");
      }

      const { data, error: factorsError } =
        await supabase.auth.mfa.listFactors();

      if (factorsError) {
        console.error("Factors Error:", factorsError);
        throw factorsError;
      }

      const factors = data?.totp || [];
      if (factors.length > 0) {
        setMfaStatus("enrolled");
      } else {
        setMfaStatus("not_enrolled");
      }

      return factors as MFAFactor[];
    } catch (err: any) {
      console.error("CATCH BLOCK - Error caught:", err);
      setError(err.message || "Failed to fetch MFA factors");
      return [];
    } finally {
      console.log("FINALLY BLOCK - Cleaning up");
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    mfaStatus,
    enrollMFA,
    verifyEnrollment,
    createChallenge,
    verifyChallenge,
    unenrollMFA,
    getFactors,
  };
};
