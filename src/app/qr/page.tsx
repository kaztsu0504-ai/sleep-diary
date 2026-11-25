import Link from "next/link";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";

export const metadata = {
  title: "QRコード配布カード | すいみん日誌",
  description: "すいみん日誌（Sleep Diary）のQRコードカード画像をダウンロードできます。",
};

export default function QrCodePage() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 border border-slate-200/80 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 -ml-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            アプリへ戻る
          </Link>
          <span className="text-xs font-medium text-slate-400">
            PNG / 1080×1440px
          </span>
        </div>

        <h1 className="mt-4 text-lg font-bold text-slate-900">
          すいみん日誌 QRコードカード
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          下のボタンからタイトル入りのカード画像を保存できます。
        </p>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-sky-50/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sleep-diary-qr-card.png"
            alt="すいみん日誌 QRコードカード"
            className="w-full h-auto block"
          />
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <a
            href="/sleep-diary-qr-card.png"
            download="sleep-diary-qr-card.png"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700 active:scale-[0.99] transition"
          >
            <Download className="h-4 w-4" />
            QRコードカードをダウンロード（PNG）
          </a>
          <a
            href="/sleep-diary-qr-card.png"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            <ExternalLink className="h-4 w-4" />
            画像だけ別タブで開く
          </a>
        </div>
      </div>
    </div>
  );
}
