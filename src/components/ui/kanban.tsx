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
        className={cn(
          "relative block w-full cursor-grab rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default active:cursor-grabbing",
          card.kind === "project" && "pt-3",
        )}
        aria-label={card.title}
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
        {card.kind === "project" && (
          <span
            aria-hidden="true"
            className="absolute top-0 left-0 h-5 w-2/5 rounded-t-xl border bg-card"
          />
        )}
        <div className="relative">
          {renderCard ? <Card>{renderCard(card)}</Card> : <CardBody card={card} />}
        </div>
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
      <header className="mb-5 flex items-center gap-2 px-1">
        <Icon className="size-4" />
        <h2 className="font-medium">{column.title}</h2>
        <span className="ml-auto tabular-nums">{column.cards.length}</span>
        {onAddCard && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Add to ${column.title}`}
            onClick={addCard}
          >
            <Plus />
          </Button>
        )}
      </header>
      <div
        className={cn(
          "flex min-h-64 flex-1 flex-col gap-4 rounded-xl p-1",
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
