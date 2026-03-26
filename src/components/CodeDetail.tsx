"use client";

import { useEffect } from "react";
import { FirmwareData, FirmwareId, FirmwareInfo, GCodeEntry } from "@/types/gcode";

interface CodeDetailProps {
  entry: GCodeEntry;
  firmware: FirmwareInfo;
  allFirmwareData: Record<FirmwareId, FirmwareData>;
  onClose: () => void;
  onNavigate: (code: string, firmwareId?: FirmwareId) => void;
  onCompare: (code: string) => void;
}

export function CodeDetail({
  entry,
  firmware,
  allFirmwareData,
  onClose,
  onNavigate,
  onCompare,
}: CodeDetailProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Check if a code exists in the current firmware
  const currentFwCodes = allFirmwareData[firmware.id as FirmwareId]?.codes ?? [];
  function codeExistsInCurrentFw(code: string): boolean {
    return currentFwCodes.some((c) => c.code === code);
  }

  // Count how many firmwares have this code
  const fwsWithCode = Object.entries(allFirmwareData).filter(([, fw]) =>
    fw.codes.some((c) => c.code === entry.code)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-bold text-emerald-400">
                {entry.code}
              </span>
              <span className="text-lg text-gray-200">{entry.name}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">{firmware.name}</span>
              {fwsWithCode.length > 1 && (
                <button
                  onClick={() => onCompare(entry.code)}
                  className="text-xs text-emerald-500 hover:text-emerald-400 underline"
                >
                  Compare across {fwsWithCode.length} firmwares
                </button>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 p-1"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Description */}
          <section>
            <p className="text-gray-300 leading-relaxed">{entry.description}</p>
          </section>

          {/* Parameters */}
          {entry.parameters.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Parameters
              </h3>
              <div className="space-y-1">
                {entry.parameters.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-baseline gap-3 text-sm"
                  >
                    <code className="font-mono text-emerald-400 font-bold w-8">
                      {p.name}
                    </code>
                    <span className="text-gray-300">{p.description}</span>
                    {p.optional && (
                      <span className="text-xs text-gray-600">(optional)</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Examples */}
          {entry.examples.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Examples
              </h3>
              <div className="space-y-2">
                {entry.examples.map((ex, i) => (
                  <div key={i} className="bg-gray-950 rounded-lg p-3">
                    <pre className="font-mono text-sm text-emerald-300 whitespace-pre-wrap">
                      {ex.code}
                    </pre>
                    <p className="text-xs text-gray-500 mt-1">
                      {ex.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Mode-specific notes */}
          {entry.modeNotes.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Mode-Specific Behavior
              </h3>
              <div className="space-y-2">
                {entry.modeNotes.map((mn, i) => (
                  <div
                    key={i}
                    className="bg-blue-950/30 border border-blue-900/50 rounded-lg p-3"
                  >
                    <div className="text-sm font-medium text-blue-400 mb-1">
                      {mn.mode}
                    </div>
                    <p className="text-sm text-gray-300">{mn.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Cross-references */}
          {entry.crossReferences.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Cross-Firmware References
              </h3>
              <div className="space-y-2">
                {entry.crossReferences.map((xref, i) => {
                  const isWarning =
                    xref.note.includes("WARNING") ||
                    xref.note.includes("CONFLICT") ||
                    xref.note.includes("CRITICAL");
                  const targetFw = allFirmwareData[xref.firmwareId]?.firmware;
                  const targetCode = xref.code || entry.code;
                  const targetExists = allFirmwareData[xref.firmwareId]?.codes.some(
                    (c) => c.code === targetCode
                  );

                  return (
                    <div
                      key={i}
                      className={`rounded-lg p-3 ${
                        isWarning
                          ? "bg-amber-950/30 border border-amber-900/50"
                          : "bg-gray-800/50 border border-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {targetExists ? (
                          <button
                            onClick={() => onNavigate(targetCode, xref.firmwareId)}
                            className={`text-sm font-medium underline hover:opacity-80 ${
                              isWarning ? "text-amber-400" : "text-emerald-400"
                            }`}
                          >
                            {targetFw?.name ?? xref.firmwareId}
                          </button>
                        ) : (
                          <span
                            className={`text-sm font-medium ${
                              isWarning ? "text-amber-400" : "text-gray-300"
                            }`}
                          >
                            {targetFw?.name ?? xref.firmwareId}
                          </span>
                        )}
                        {xref.code && (
                          targetExists ? (
                            <button
                              onClick={() => onNavigate(targetCode, xref.firmwareId)}
                              className="font-mono text-xs text-emerald-400 bg-gray-800 px-1.5 py-0.5 rounded hover:bg-gray-700"
                            >
                              {xref.code}
                            </button>
                          ) : (
                            <code className="font-mono text-xs text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">
                              {xref.code}
                            </code>
                          )
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{xref.note}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Related codes */}
          {entry.relatedCodes.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Related Codes
              </h3>
              <div className="flex gap-2 flex-wrap">
                {entry.relatedCodes.map((rc) => {
                  const exists = codeExistsInCurrentFw(rc);
                  return exists ? (
                    <button
                      key={rc}
                      onClick={() => onNavigate(rc)}
                      className="font-mono text-sm bg-gray-800 text-emerald-400 px-2 py-1 rounded hover:bg-gray-700 hover:text-emerald-300 transition-colors"
                    >
                      {rc}
                    </button>
                  ) : (
                    <span
                      key={rc}
                      className="font-mono text-sm bg-gray-800 text-gray-500 px-2 py-1 rounded"
                    >
                      {rc}
                    </span>
                  );
                })}
              </div>
            </section>
          )}

          {/* Notes */}
          {entry.notes && (
            <section>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Notes
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {entry.notes}
              </p>
            </section>
          )}

          {/* Version notes */}
          {entry.versionNotes && (
            <section>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Version Notes
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {entry.versionNotes}
              </p>
            </section>
          )}

          {/* Sources */}
          {entry.sources.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Sources
              </h3>
              <ul className="space-y-1">
                {entry.sources.map((src, i) => (
                  <li key={i}>
                    <a
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-500 hover:text-emerald-400 underline break-all"
                    >
                      {src}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
