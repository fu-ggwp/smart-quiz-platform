import React from "react";

export default function DocumentViewer({ materialUrl, materialName }) {
  if (!materialUrl) {
    return <div className="text-gray-500 text-xs">No document attached.</div>;
  }

  const fileExtension = materialName.split(".").pop().toLowerCase();

  const nativeSupported = ["pdf", "png", "jpg", "jpeg", "gif", "svg", "txt"];
  if (nativeSupported.includes(fileExtension)) {
    return (
      <iframe
        src={materialUrl}
        className="w-full h-full min-h-[500px]"
        title={materialName}
      />
    );
  }

  const officeSupported = ["docx", "doc", "pptx", "ppt", "xlsx", "xls"];
  if (officeSupported.includes(fileExtension)) {
    const encodedUrl = encodeURIComponent(materialUrl);
    const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;

    return (
      <iframe
        src={officeViewerUrl}
        className="w-full h-full min-h-[500px]"
        title={materialName}
        frameBorder="0"
      />
    );
  }

  return (
    <div className="p-6 text-center bg-muted/20 flex flex-col items-center justify-center h-full min-h-[250px] w-full">
      <p className="text-xs text-muted-foreground mb-4">
        This file format ({fileExtension}) is not supported for inline viewing.
      </p>
      <a
        href={materialUrl}
        download
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition"
      >
        Download File ({materialName})
      </a>
    </div>
  );
}
