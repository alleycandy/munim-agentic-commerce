import { useEffect, useState } from "react";
import { MERCHANT } from "@/lib/catalog";
import type { CartLine, Mandate, Payment, Quote } from "@/lib/policy";
import { cn, formatInr, formatTime } from "@/lib/utils";

export function Receipt({
  lines,
  quote,
  mandate,
  payment,
  buyer,
  className,
}: {
  lines: CartLine[];
  quote: Quote | null;
  mandate: Mandate | null;
  payment: Payment | null;
  buyer: string;
  className?: string;
}) {
  const shown = quote?.lines ?? lines;
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
  }, [shown.length, mandate?.id, payment?.id]);

  return (
    <aside
      className={cn(
        "relative rounded-[2px] bg-[#FAF7F2] text-[#1D1915] shadow-[0_12px_32px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.06)] border border-[#E3DACD]",
        className,
      )}
    >
      {/* Top serrated torn paper edge */}
      <div
        className="h-2 w-full"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #FAF7F2 50%, transparent 50%), linear-gradient(225deg, #FAF7F2 50%, transparent 50%)",
          backgroundPosition: "top left",
          backgroundSize: "10px 8px",
          backgroundRepeat: "repeat-x",
          marginTop: "-7px",
        }}
      />

      <div className="px-5 pb-6 pt-4 font-mono text-[11px] leading-relaxed sm:px-6">
        {/* Store Header */}
        <div className="text-center border-b border-dashed border-[#C5BBAA] pb-3">
          <h2 className="font-bold text-sm tracking-wider uppercase text-[#1D1915]">
            GUPTAJI & SONS GENERAL STORES
          </h2>
          <p className="text-[10px] text-[#635A4F] uppercase tracking-wider font-semibold mt-0.5">
            Provisions, Spices & Dry Goods
          </p>
          <p className="text-[10px] text-[#4A433A] mt-1 font-sans font-medium leading-tight">
            14 Fraser Road, Dak Bungalow Chowk
            <br />
            Patna, Bihar — 800001
          </p>
          <p className="text-[9.5px] text-[#6E6558] mt-1 tracking-tight">
            Ph: +91 612 2634 1188 | GSTIN: {MERCHANT.gstin}
          </p>
        </div>

        {/* Invoice Metadata */}
        <div className="mt-2.5 flex items-center justify-between text-[10px] font-semibold text-[#3D362E] border-b border-dashed border-[#C5BBAA] pb-2">
          <span>TAX INVOICE / CASH MEMO</span>
          <span>{now ? formatTime(now) : "05/09/2026 07:12 AM"}</span>
        </div>

        <div className="mt-2 text-[10.5px] space-y-0.5 text-[#332D25]">
          <p>
            <span className="text-[#6E6558]">Inv No:</span> PAT-2026/09/{payment?.id?.slice(-4) || "0421"}
          </p>
          <p>
            <span className="text-[#6E6558]">Buyer:</span> {buyer || "Hotel Surya (Procurement Agent)"}
          </p>
        </div>

        {/* Itemized Table */}
        <div className="mt-3 border-t border-b border-[#2C2620] py-1.5 font-bold text-[10px] text-[#1D1915] flex justify-between tracking-wider">
          <span className="w-1/2">ITEM DESCRIPTION</span>
          <span className="w-1/4 text-center">QTY</span>
          <span className="w-1/4 text-right">AMOUNT</span>
        </div>

        <div className="my-2 space-y-2">
          {shown.length === 0 ? (
            <p className="text-center py-4 text-[#827768] italic font-sans text-xs">
              — No items on chit yet —
            </p>
          ) : (
            shown.map((l) => (
              <div key={l.sku} className="flex justify-between items-start text-[11px] text-[#1D1915]">
                <div className="w-1/2 pr-1">
                  <span className="font-semibold block">{l.name}</span>
                  {l.note ? (
                    <span className="text-[9.5px] text-[#786D5F] block font-sans leading-tight">
                      Note: {l.note}
                    </span>
                  ) : null}
                </div>
                <div className="w-1/4 text-center tabular-nums text-[#4A433A]">
                  {l.qty}
                </div>
                <div className="w-1/4 text-right tabular-nums font-medium">
                  {formatInr(l.unitPaise * l.qty)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Financial Totals */}
        {quote ? (
          <div className="mt-3 border-t border-dashed border-[#C5BBAA] pt-2 space-y-1 text-[10.5px] tabular-nums text-[#332D25]">
            <div className="flex justify-between">
              <span className="text-[#6E6558]">Subtotal (Excl. Tax):</span>
              <span>{formatInr(quote.subtotalPaise)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6558]">CGST @ 2.5%:</span>
              <span>{formatInr(Math.round(quote.gstPaise / 2))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6558]">SGST @ 2.5%:</span>
              <span>{formatInr(Math.round(quote.gstPaise / 2))}</span>
            </div>
            <div className="mt-2 border-t-2 border-double border-[#1D1915] pt-1.5 flex justify-between text-sm font-bold text-[#1D1915]">
              <span>NET TOTAL AMOUNT:</span>
              <span>{formatInr(quote.totalPaise)}</span>
            </div>
          </div>
        ) : null}

        {/* Agentic Payment Details */}
        {(mandate || payment) && (
          <div className="mt-3 border-t border-dashed border-[#C5BBAA] pt-2 text-[10px] text-[#4A433A] space-y-1">
            <p className="font-bold text-[9.5px] uppercase tracking-wider text-[#6E6558]">
              PAYMENT METHOD: RAZORPAY AGENTIC MANDATE
            </p>
            {mandate && (
              <p>
                Mandate ID: <span className="font-bold">{mandate.id}</span> ({mandate.status})
                <br />
                Limit: {formatInr(mandate.maxPaise)}
              </p>
            )}
            {payment && (
              <p>
                Txn Ref: <span className="font-bold">{payment.id}</span> ({payment.status})
                {payment.failureCode && <span className="text-[#8F2D2D]"> · {payment.failureCode}</span>}
              </p>
            )}
          </div>
        )}

        {/* Realistic Rubber Stamp */}
        <div className="mt-5 flex justify-center py-1">
          {payment?.status === "captured" ? (
            <div className="border-2 border-[#1E6B3C] text-[#1E6B3C] px-3 py-1.5 rounded-sm transform -rotate-6 font-bold text-center tracking-wider bg-[#1E6B3C]/5 shadow-sm">
              <div className="text-[13px] leading-tight font-serif uppercase">★ PAID & CAPTURED ★</div>
              <div className="text-[9px] font-mono font-normal">GUPTAJI & SONS · PATNA, BIHAR</div>
            </div>
          ) : payment?.status === "failed" ? (
            <div className="border-2 border-[#8F2D2D] text-[#8F2D2D] px-3 py-1.5 rounded-sm transform -rotate-6 font-bold text-center tracking-wider bg-[#8F2D2D]/5 shadow-sm">
              <div className="text-[13px] leading-tight font-serif uppercase">★ PAYMENT HELD / EXPIRED ★</div>
              <div className="text-[9px] font-mono font-normal">GUPTAJI & SONS · PATNA, BIHAR</div>
            </div>
          ) : mandate?.status === "blocked" ? (
            <div className="border-2 border-[#8F2D2D] text-[#8F2D2D] px-3 py-1.5 rounded-sm transform -rotate-6 font-bold text-center tracking-wider bg-[#8F2D2D]/5 shadow-sm">
              <div className="text-[13px] leading-tight font-serif uppercase">★ MANDATE REJECTED ★</div>
              <div className="text-[9px] font-mono font-normal">GUPTAJI & SONS · PATNA, BIHAR</div>
            </div>
          ) : (
            <div className="text-center font-mono text-[9.5px] uppercase tracking-widest text-[#827768] py-1 border border-dashed border-[#C5BBAA] px-3 w-full">
              Official Tax Invoice Chit — Patna, Bihar
            </div>
          )}
        </div>

        {/* Barcode & Footer */}
        <div className="mt-4 text-center border-t border-dashed border-[#C5BBAA] pt-3">
          <div className="font-mono text-xs tracking-[0.3em] font-bold text-[#3D362E] select-none">
            ||| | |||| || | ||||| |||| ||| ||| | ||
          </div>
          <p className="mt-1 text-[9px] font-medium uppercase tracking-wider text-[#6E6558]">
            DHANYAWAD! THANK YOU FOR SHOPPING
          </p>
          <p className="text-[8.5px] text-[#8C8172]">
            Guptaji & Sons · Fraser Road, Patna, Bihar
          </p>
        </div>
      </div>

      {/* Bottom serrated torn paper edge */}
      <div
        className="h-2 w-full"
        style={{
          backgroundImage:
            "linear-gradient(45deg, #FAF7F2 50%, transparent 50%), linear-gradient(315deg, #FAF7F2 50%, transparent 50%)",
          backgroundPosition: "bottom left",
          backgroundSize: "10px 8px",
          backgroundRepeat: "repeat-x",
          marginBottom: "-7px",
        }}
      />
    </aside>
  );
}
