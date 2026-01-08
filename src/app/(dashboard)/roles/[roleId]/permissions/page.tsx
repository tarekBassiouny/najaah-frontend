import { RolePermissionsForm } from "@/features/role-permissions/components/RolePermissionsForm";

type RolePermissionsPageProps = {
  params: {
    roleId: string;
  };
};

export default function RolePermissionsPage({
  params,
}: RolePermissionsPageProps) {
  return <RolePermissionsForm roleId={params.roleId} />;
}
