"use client";
import {usePathname} from "next/navigation";import AdminSidebar from "@/components/admin-sidebar";
export default function AdminShell({children,role}:{children:React.ReactNode;role:"admin"|"supervisor"}){const pathname=usePathname();if(pathname==="/admin/login")return <>{children}</>;return <div className="admin-grid bg-[#f5f5f3]"><AdminSidebar role={role}/><div className="min-w-0">{children}</div></div>}
