import { useEffect, type ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, Info, Copy, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const AUTO_DISMISS_MS = 3500

type Variant = "default" | "destructive" | "success" | "warning" | "info" | (string & {})

function getConfig(variant: Variant, title?: ReactNode) {
  const titleStr = typeof title === "string" ? title.toLowerCase() : ""
  const isCopy = titleStr.includes("copi") || titleStr.includes("copié")

  if (variant === "destructive") {
    return {
      Icon: XCircle,
      ringOuter: "bg-red-100",
      ringMid: "bg-red-200",
      iconBg: "bg-red-500",
      headerBg: "bg-gradient-to-b from-red-50 to-white",
      btnClass: "bg-gray-100 hover:bg-gray-200 text-gray-700",
      btnLabel: "Fermer",
    }
  }
  if (isCopy) {
    return {
      Icon: Copy,
      ringOuter: "bg-blue-100",
      ringMid: "bg-blue-200",
      iconBg: "bg-blue-500",
      headerBg: "bg-gradient-to-b from-blue-50 to-white",
      btnClass: "bg-blue-500 hover:bg-blue-600 text-white",
      btnLabel: "OK",
    }
  }
  if (variant === "warning") {
    return {
      Icon: AlertTriangle,
      ringOuter: "bg-amber-100",
      ringMid: "bg-amber-200",
      iconBg: "bg-amber-500",
      headerBg: "bg-gradient-to-b from-amber-50 to-white",
      btnClass: "bg-gray-100 hover:bg-gray-200 text-gray-700",
      btnLabel: "Fermer",
    }
  }
  if (variant === "info") {
    return {
      Icon: Info,
      ringOuter: "bg-blue-100",
      ringMid: "bg-blue-200",
      iconBg: "bg-blue-500",
      headerBg: "bg-gradient-to-b from-blue-50 to-white",
      btnClass: "bg-blue-500 hover:bg-blue-600 text-white",
      btnLabel: "OK",
    }
  }
  return {
    Icon: CheckCircle2,
    ringOuter: "bg-green-100",
    ringMid: "bg-green-200",
    iconBg: "bg-green-500",
    headerBg: "bg-gradient-to-b from-green-50 to-white",
    btnClass: "bg-green-500 hover:bg-green-600 text-white",
    btnLabel: "OK",
  }
}

export function Toaster() {
  const { toasts, dismiss } = useToast()
  const toast = toasts[0]

  useEffect(() => {
    if (!toast?.open) return undefined
    const v = (toast as { variant?: string }).variant ?? "default"
    if (v !== "destructive") {
      const timer = setTimeout(() => dismiss(toast.id), AUTO_DISMISS_MS)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [toast?.id, toast?.open])

  const isVisible = !!(toast?.open)
  const variant = ((toast as { variant?: string })?.variant ?? "default") as Variant
  const cfg = toast ? getConfig(variant, toast.title) : null
  const { Icon, ringOuter, ringMid, iconBg, headerBg, btnClass, btnLabel } = cfg ?? {
    Icon: CheckCircle2, ringOuter: "", ringMid: "", iconBg: "", headerBg: "", btnClass: "", btnLabel: "OK",
  }

  return (
    <AnimatePresence>
      {isVisible && toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-5"
          style={{ background: "rgba(0,0,0,0.50)", backdropFilter: "blur(5px)" }}
          onClick={() => dismiss(toast.id)}
        >
          <motion.div
            initial={{ scale: 0.80, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 22, stiffness: 340 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-[310px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-center pt-9 pb-5 ${headerBg}`}>
              <div className={`relative flex items-center justify-center w-28 h-28 rounded-full ${ringOuter}`}>
                <div className={`absolute w-[84px] h-[84px] rounded-full ${ringMid}`} />
                <div className={`relative z-10 w-16 h-16 rounded-full ${iconBg} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-8 h-8 text-white" strokeWidth={2.2} />
                </div>
              </div>
            </div>

            <div className="px-6 pt-1 pb-2 text-center">
              {toast.title && (
                <h3 className="text-[19px] font-bold text-gray-900 leading-snug">
                  {toast.title}
                </h3>
              )}
              {toast.description && (
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                  {toast.description as React.ReactNode}
                </p>
              )}
            </div>

            <div className="px-6 pb-6 mt-3">
              <button
                onClick={() => dismiss(toast.id)}
                className={`w-full py-3 rounded-2xl font-semibold text-sm transition-colors ${btnClass}`}
              >
                {btnLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
