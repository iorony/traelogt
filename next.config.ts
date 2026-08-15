import type {NextConfig} from "next";

function getSupabaseHostname(){
  try{return process.env.NEXT_PUBLIC_SUPABASE_URL?new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname:null}
  catch{return null}
}

const supabaseHostname=getSupabaseHostname();
const nextConfig:NextConfig={
  // Las fotos se envían desde el formulario de administración mediante una
  // Server Action. El límite predeterminado de Next es 1 MB, menor que una
  // fotografía habitual de móvil. 4 MB queda dentro del límite de 4.5 MB de
  // las Functions de Vercel.
  experimental:{
    serverActions:{
      bodySizeLimit:"4mb",
    },
  },
  images:{
    remotePatterns:[
      {protocol:"https",hostname:"images.unsplash.com"},
      ...(supabaseHostname?[{protocol:"https" as const,hostname:supabaseHostname,pathname:"/storage/v1/object/public/**"}]:[]),
    ],
  },
};

export default nextConfig;
