import AdminShell from "@/components/admin-shell";import {createClient} from "@/lib/supabase/server";
export default async function AdminLayout({children}:{children:React.ReactNode}){const db=await createClient();const {data}=await db.rpc("get_my_access_context");const role=(data as {role?:string}|null)?.role==="admin"?"admin":"supervisor";return <AdminShell role={role}>{children}</AdminShell>}
