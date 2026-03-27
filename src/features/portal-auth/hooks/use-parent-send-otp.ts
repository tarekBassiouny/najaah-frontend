import { useMutation } from "@tanstack/react-query";
import { parentSendOtp } from "../services/portal-auth.service";
import type { SendOtpRequest, SendOtpResponse } from "../types/portal-auth";

export function useParentSendOtp() {
  return useMutation<SendOtpResponse, Error, SendOtpRequest>({
    mutationFn: parentSendOtp,
  });
}
