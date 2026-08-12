import {readFileSync,readdirSync} from "node:fs";
import {extname,join} from "node:path";
import {describe,expect,it} from "vitest";

const roots=[join(process.cwd(),"src"),join(process.cwd(),"supabase","migrations")];
const extensions=new Set([".ts",".tsx",".sql",".css",".md",".json"]);
const mojibake=new RegExp("(?:\\u00c3.|\\u00c2[\\u0080-\\u00bf ]|\\u00e2[\\u0080-\\u00bf]{2}|\\ufffd)","u");

function sourceFiles(directory:string):string[]{
  return readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?sourceFiles(join(directory,entry.name)):extensions.has(extname(entry.name))?[join(directory,entry.name)]:[]);
}

describe("text encoding",()=>{
  it("contains no UTF-8 sequences interpreted as Windows-1252",()=>{
    const affected=roots.flatMap(sourceFiles).filter(file=>mojibake.test(readFileSync(file,"utf8")));
    expect(affected,`Files with malformed characters:\n${affected.join("\n")}`).toEqual([]);
  });
});
