"use client";

import {useRef,useState} from "react";

const MAX_TOTAL_BYTES=3_500_000;
const MAX_DIMENSION=1920;
type Props={className?:string;multiple?:boolean;required?:boolean};

async function compressImage(file:File,targetBytes:number){
  const source=await createImageBitmap(file,{imageOrientation:"from-image"});
  const scale=Math.min(1,MAX_DIMENSION/Math.max(source.width,source.height));
  let width=Math.max(1,Math.round(source.width*scale)),height=Math.max(1,Math.round(source.height*scale));
  const canvas=document.createElement("canvas");
  const context=canvas.getContext("2d");if(!context)throw new Error("No fue posible preparar la imagen");
  let quality=.88,blob:Blob|null=null;
  do{
    canvas.width=width;canvas.height=height;context.drawImage(source,0,0,width,height);
    quality=.88;blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/webp",quality));
    while(blob&&blob.size>targetBytes&&quality>.5){quality-=.08;blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/webp",quality))}
    width=Math.round(width*.85);height=Math.round(height*.85);
  }while(blob&&blob.size>targetBytes&&width>640&&height>640);
  source.close();
  if(!blob)throw new Error("No fue posible comprimir la imagen");
  return new File([blob],`${file.name.replace(/\.[^.]+$/,"")}.webp`,{type:"image/webp"});
}

export default function CompressedImageInput({className,multiple=false,required=false}:Props){
  const inputRef=useRef<HTMLInputElement>(null),[message,setMessage]=useState("");
  async function onChange(event:React.ChangeEvent<HTMLInputElement>){
    const files=Array.from(event.target.files??[]);if(!files.length)return;
    if(files.length>10){setMessage("Selecciona un máximo de 10 imágenes.");event.target.value="";return}
    setMessage("Optimizando imágenes para subirlas más rápido…");
    try{
      const targetPerImage=Math.min(1_500_000,Math.floor(MAX_TOTAL_BYTES/files.length));
      const compressed=await Promise.all(files.map(file=>compressImage(file,targetPerImage)));
      const transfer=new DataTransfer();compressed.forEach(file=>transfer.items.add(file));
      if(inputRef.current)inputRef.current.files=transfer.files;
      const original=files.reduce((sum,file)=>sum+file.size,0),optimized=compressed.reduce((sum,file)=>sum+file.size,0);
      setMessage(`Listas: ${compressed.length} imagen${compressed.length===1?"":"es"} optimizada${compressed.length===1?"":"s"} (${Math.round(optimized/1024)} KB; antes ${Math.round(original/1024)} KB).`);
    }catch{event.target.value="";setMessage("No se pudieron optimizar las imágenes. Intenta con JPG, PNG o WebP.")}
  }
  return <><input ref={inputRef} name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} required={required} onChange={onChange} className={className}/>{message&&<small className={`mt-2 block ${message.startsWith("No se")||message.startsWith("Selecciona")?"text-red-700":"text-[#888]"}`} aria-live="polite">{message}</small>}</>;
}
