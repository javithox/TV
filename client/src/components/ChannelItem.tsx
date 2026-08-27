import { Play, Radio } from "lucide-react";
import type { ContentItem } from "@/services/api";

type ChannelItemProps = {
  channel: ContentItem;
  selected: boolean;
  onPress: () => void;
};

export default function ChannelItem({ channel, selected, onPress }: ChannelItemProps) {
  return (
    <button type="button" onClick={onPress} className={`channel-row ${selected ? "selected" : ""}`} aria-current={selected ? "true" : undefined}>
      <span className="channel-logo">{channel.logoUrl ? <img src={channel.logoUrl} alt="" /> : <Radio size={16} />}</span>
      <span className="min-w-0 flex-1 text-left">
        <strong className="block truncate text-sm">{channel.title}</strong>
        <small className="mt-1 block truncate text-[10px] tracking-wider text-slate-500">{channel.category} // {channel.sourceName}</small>
      </span>
      <Play size={15} />
    </button>
  );
}
