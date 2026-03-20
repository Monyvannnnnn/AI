import type { GeneratedCode } from "@/types/chat";
import CodeOutput from "@/components/CodeOutput";

interface GeneratedCodePanelProps {
  code: GeneratedCode;
}

const GeneratedCodePanel = ({ code }: GeneratedCodePanelProps) => {
  return (
    <div className="mt-4">
      <CodeOutput visible generatedCode={code} />
    </div>
  );
};

export default GeneratedCodePanel;
