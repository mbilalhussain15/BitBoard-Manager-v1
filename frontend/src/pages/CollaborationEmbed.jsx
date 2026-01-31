export default function CollaborationEmbed() {
  return (
    // <div className="h-[calc(100vh-64px)] w-full">
    //   <iframe
    //     title="Code Sync Collaboration"
    //     src="http://localhost:5174"
    //     className="h-full w-full border-0"
    //     allow="clipboard-read; clipboard-write"
    //   />
    // </div>
    <div className="w-full h-full overflow-hidden rounded-lg">
      <iframe
        title="Code Sync Collaboration"
        src="http://localhost:5174"
        className="w-full h-full border-0 block"
        scrolling="no"
      />
    </div>
  );
}
