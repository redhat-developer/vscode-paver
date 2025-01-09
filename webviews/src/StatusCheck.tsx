import { VscArrowCircleDown, VscCircleLarge, VscCircleLargeFilled, VscPass, VscPassFilled, VscStopCircle } from "react-icons/vsc";


export type StatusValue = 'complete' | 'installing' | 'partial' | 'missing' | 'stopped';

export interface StatusCheckProps {
  type: StatusValue | null;
  title?: string;
}

const DEFAULT_COLOR = "var(--vscode-textLink-foreground)";
const ERROR_COLOR = "var(--vscode-errorForeground)";

export const StatusCheck: React.FC<StatusCheckProps> = ({ type, title }: StatusCheckProps) => {
  switch (type) {
    case null:
      return <VscCircleLargeFilled color={DEFAULT_COLOR} />;
    case "complete":
      return <VscPassFilled color={DEFAULT_COLOR} title={title} />;
    case "installing":
      return <VscArrowCircleDown color={DEFAULT_COLOR} title={title} />;
    case "partial":
      return <VscPass color={DEFAULT_COLOR} title={title} />;
    case "stopped":
      return <VscStopCircle color={ERROR_COLOR} title={title} />
    default: //"missing"
      return <VscCircleLarge title={title} />;
  }
};