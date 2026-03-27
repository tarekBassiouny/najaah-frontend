import { useMutation } from "@tanstack/react-query";
import { parentRegister } from "../services/portal-auth.service";
import type {
  ParentRegisterRequest,
  ParentRegisterResponse,
} from "../types/portal-auth";

export function useParentRegister() {
  return useMutation<ParentRegisterResponse, Error, ParentRegisterRequest>({
    mutationFn: parentRegister,
  });
}
