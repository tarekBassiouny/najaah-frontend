import { useMutation } from "@tanstack/react-query";
import { studentSendOtp } from "../services/portal-auth.service";
import type { SendOtpRequest, SendOtpResponse } from "../types/portal-auth";

export function useStudentSendOtp() {
  return useMutation<SendOtpResponse, Error, SendOtpRequest>({
    mutationFn: studentSendOtp,
  });
}
