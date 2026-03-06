type StructuredDataScriptProps = {
  data: Record<string, unknown>;
};

function serializeStructuredData(data: Record<string, unknown>) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function StructuredDataScript({
  data
}: StructuredDataScriptProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeStructuredData(data)
      }}
    />
  );
}
