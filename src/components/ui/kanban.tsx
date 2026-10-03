"use client";

import { Circle, CircleCheck, Clock3, Plus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";
import {
  useCallback,
  useState,
  type Dispatch,
  type DragEvent,
  type ReactNode,
  type SetStateAction,
} from "react";

import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const columnIcons = { todo: Circle, "in-progress": Clock3, done: CircleCheck };
const columnAccents = {
  todo: "text-muted-foreground",
  "in-progress": "text-primary",
  done: "text-chart-2",
};
const columnRules = {
  todo: "bg-muted-foreground/30",
  "in-progress": "bg-primary",
  done: "bg-chart-2",
};
export type ColumnStatus = keyof typeof columnIcons;
export type Assignee = { name: string; avatar?: string };
export type CardTag = { label: string; variant?: string };
export type CardData = {
  id: string;
  title: string;
  kind?: "task" | "project";
  tags?: CardTag[];
  assignee?: Assignee;
  assignees?: Assignee[];
  date?: string;
};
export type ColumnData = {
  id: ColumnStatus;
  title: string;
  status: ColumnStatus;
  cards: CardData[];
};
export type DragState = { cardId: string; fromColumn: ColumnStatus } | null;
export type ColumnProps = {
  column: ColumnData;
  onDrop: (cardId: string, fromColumnId: ColumnStatus, toColumnId: ColumnStatus) => void;
  dragState: DragState;
  setDragState: Dispatch<SetStateAction<DragState>>;
  onCardClick: (card: CardData) => void;
  onAddCard?: (columnId: ColumnStatus) => void;
  renderAdd?: (columnId: ColumnStatus) => ReactNode;
  renderCard?: (card: CardData) => ReactNode;
  disabled?: boolean;
};
export const gentleSpring = { type: "spring", duration: 0.2, bounce: 0 } satisfies Transition;
const cardVariants = {
  initial: { opacity: 0, transform: "translateY(6px)" },
  animate: { opacity: 1, transform: "translateY(0px)" },
  exit: { opacity: 0 },
};
const cardHover = { transform: "translateY(-2px)" };
const cardPress = { transform: "scale(0.99)" };

function CardBody({ card }: { card: CardData }) {
  const assignees = card.assignees ?? (card.assignee ? [card.assignee] : []);
  return (
    <Card>
      <CardHeader>
        {card.tags && card.tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {card.tags.map((tag) => (
              <Badge variant="secondary" key={tag.label}>
                {tag.label}
              </Badge>
            ))}
          </div>
        )}
        <CardTitle>{card.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <AvatarGroup>
          {assignees.map((assignee) => (
            <Avatar key={assignee.name} title={assignee.name}>
              {assignee.avatar && <AvatarImage src={assignee.avatar} alt={assignee.name} />}
              <AvatarFallback>{assignee.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
          ))}
        </AvatarGroup>
        {card.date && <span className="text-sm tabular-nums">{card.date}</span>}
      </CardContent>
    </Card>
  );
}

function WorkCard({
  card,
  column,
  setDragState,
  onCardClick,
  renderCard,
  disabled,
}: {
  card: CardData;
  column: ColumnStatus;
} & Pick<ColumnProps, "setDragState" | "onCardClick" | "renderCard" | "disabled">) {
  const reducedMotion = useReducedMotion();
  const startDrag = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", card.id);
      setDragState({ cardId: card.id, fromColumn: column });
    },
    [card.id, column, setDragState],
  );
  const endDrag = useCallback(() => setDragState(null), [setDragState]);
  const openCard = useCallback(() => onCardClick(card), [card, onCardClick]);
  return (
    <div draggable={!disabled} onDragStart={startDrag} onDragEnd={endDrag}>
      <motion.button
        type="button"
        className="relative block w-full cursor-grab rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing disabled:cursor-default"
        aria-label={card.kind === "project" ? `Open project ${card.title}` : card.title}
        disabled={disabled}
        initial={reducedMotion ? false : "initial"}
        animate="animate"
        exit="exit"
        layout={!reducedMotion}
        transition={gentleSpring}
        variants={cardVariants}
        whileHover={reducedMotion ? undefined : cardHover}
        whileTap={reducedMotion ? undefined : cardPress}
        onClick={openCard}
      >
        {renderCard ? renderCard(card) : <CardBody card={card} />}
      </motion.button>
    </div>
  );
}

export function Column({
  column,
  onDrop,
  dragState,
  setDragState,
  onCardClick,
  onAddCard,
  renderAdd,
  renderCard,
  disabled,
}: ColumnProps) {
  const [dragOver, setDragOver] = useState(false);
  const Icon = columnIcons[column.status];
  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!dragState || disabled) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      setDragOver(true);
    },
    [dragState, disabled],
  );
  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))
      return;
    setDragOver(false);
  }, []);
  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragOver(false);
      if (!disabled && dragState && dragState.fromColumn !== column.id) {
        onDrop(dragState.cardId, dragState.fromColumn, column.id);
      }
      setDragState(null);
    },
    [disabled, dragState, column.id, onDrop, setDragState],
  );
  const addCard = useCallback(() => onAddCard?.(column.id), [onAddCard, column.id]);
  return (
    <section className="flex h-full min-h-80 min-w-0 flex-col" aria-label={column.title}>
      <div aria-hidden="true" className={cn("h-1 rounded-full", columnRules[column.status])} />
      <header className="mt-3 mb-3 flex items-center gap-2 px-1">
        <Icon className={cn("size-4", columnAccents[column.status])} />
        <h2 className="text-sm font-semibold tracking-tight">{column.title}</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
          {column.cards.length}
        </span>
        <div className="ml-auto">
          {renderAdd
            ? renderAdd(column.id)
            : onAddCard && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Add to ${column.title}`}
                  onClick={addCard}
                >
                  <Plus />
                </Button>
              )}
        </div>
      </header>
      <div
        className={cn(
          "flex min-h-64 flex-1 flex-col gap-3 rounded-xl p-1 transition-colors",
          dragOver && dragState && "bg-accent ring-1 ring-border",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <AnimatePresence initial={false}>
          {column.cards.map((card) => (
            <WorkCard
              key={card.id}
              card={card}
              column={column.id}
              setDragState={setDragState}
              onCardClick={onCardClick}
              renderCard={renderCard}
              disabled={disabled}
            />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
