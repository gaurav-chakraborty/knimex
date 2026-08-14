"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { CheckCircle2, Eraser, RotateCcw, ShieldCheck } from "lucide-react";

interface WatermarkRemovalDialogProps {
  file: File | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (file: File) => void;
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeRectangle(start: Point, end: Point, width: number, height: number): Rectangle {
  const x = clamp(Math.min(start.x, end.x), 0, width);
  const y = clamp(Math.min(start.y, end.y), 0, height);
  const right = clamp(Math.max(start.x, end.x), 0, width);
  const bottom = clamp(Math.max(start.y, end.y), 0, height);
  return { x, y, width: right - x, height: bottom - y };
}

function sampleBorderColor(context: CanvasRenderingContext2D, rectangle: Rectangle) {
  const samples: number[][] = [];
  const left = Math.max(0, Math.floor(rectangle.x) - 2);
  const right = Math.min(context.canvas.width - 1, Math.ceil(rectangle.x + rectangle.width) + 1);
  const top = Math.max(0, Math.floor(rectangle.y) - 2);
  const bottom = Math.min(context.canvas.height - 1, Math.ceil(rectangle.y + rectangle.height) + 1);

  for (let x = left; x <= right; x += Math.max(1, Math.floor((right - left) / 24))) {
    samples.push(Array.from(context.getImageData(x, top, 1, 1).data));
    samples.push(Array.from(context.getImageData(x, bottom, 1, 1).data));
  }
  for (let y = top; y <= bottom; y += Math.max(1, Math.floor((bottom - top) / 24))) {
    samples.push(Array.from(context.getImageData(left, y, 1, 1).data));
    samples.push(Array.from(context.getImageData(right, y, 1, 1).data));
  }

  const totals = samples.reduce((acc, sample) => {
    acc[0] += sample[0];
    acc[1] += sample[1];
    acc[2] += sample[2];
    acc[3] += sample[3];
    return acc;
  }, [0, 0, 0, 0]);
  const count = Math.max(samples.length, 1);
  return totals.map((value) => Math.round(value / count));
}

export default function WatermarkRemovalDialog({
  file,
  open,
  onOpenChange,
  onApply,
}: WatermarkRemovalDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<Point | null>(null);
  const [selection, setSelection] = useState<Rectangle | null>(null);
  const [feather, setFeather] = useState(12);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const renderCanvas = useCallback((nextSelection: Rectangle | null = selection) => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    if (nextSelection && nextSelection.width > 0 && nextSelection.height > 0) {
      context.save();
      context.fillStyle = "rgba(14, 165, 233, 0.18)";
      context.fillRect(nextSelection.x, nextSelection.y, nextSelection.width, nextSelection.height);
      context.strokeStyle = "#67e8f9";
      context.lineWidth = 3;
      context.setLineDash([10, 8]);
      context.strokeRect(nextSelection.x, nextSelection.y, nextSelection.width, nextSelection.height);
      context.restore();
    }
  }, []);

  useEffect(() => {
    if (!open || !file || !file.type.startsWith("image/")) {
      setIsReady(false);
      imageRef.current = null;
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const maxWidth = 1000;
      const maxHeight = 620;
      const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1);
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      imageRef.current = image;
      setSelection(null);
      setIsReady(true);
      requestAnimationFrame(() => renderCanvas(null));
    };
    image.onerror = () => {
      setIsReady(false);
      toast.error("This image could not be opened in the watermark editor.");
    };
    image.src = objectUrl;

    return () => {
      URL.revokeObjectURL(objectUrl);
      imageRef.current = null;
    };
  }, [file, open, renderCanvas]);

  useEffect(() => {
    if (isReady) renderCanvas(selection);
  }, [isReady, renderCanvas, selection]);

  const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const bounds = canvas.getBoundingClientRect();
    return {
      x: clamp((event.clientX - bounds.left) * (canvas.width / bounds.width), 0, canvas.width),
      y: clamp((event.clientY - bounds.top) * (canvas.height / bounds.height), 0, canvas.height),
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = getCanvasPoint(event);
    setIsDrawing(true);
    setSelection(null);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !dragStartRef.current || !canvasRef.current) return;
    setSelection(normalizeRectangle(dragStartRef.current, getCanvasPoint(event), canvasRef.current.width, canvasRef.current.height));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDrawing(false);
    if (dragStartRef.current && canvasRef.current) {
      setSelection(normalizeRectangle(dragStartRef.current, getCanvasPoint(event), canvasRef.current.width, canvasRef.current.height));
    }
    dragStartRef.current = null;
  };

  const resetSelection = () => {
    setSelection(null);
    renderCanvas(null);
  };

  const handleApply = async () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !file || !selection || selection.width < 4 || selection.height < 4) {
      toast.error("Draw a selection around the watermark first.");
      return;
    }

    const source = document.createElement("canvas");
    source.width = image.naturalWidth;
    source.height = image.naturalHeight;
    const sourceContext = source.getContext("2d");
    if (!sourceContext) return;
    sourceContext.drawImage(image, 0, 0, source.width, source.height);

    const scaleX = source.width / canvas.width;
    const scaleY = source.height / canvas.height;
    const target: Rectangle = {
      x: Math.round(selection.x * scaleX),
      y: Math.round(selection.y * scaleY),
      width: Math.round(selection.width * scaleX),
      height: Math.round(selection.height * scaleY),
    };
    const [red, green, blue, alpha] = sampleBorderColor(sourceContext, target);
    const gradient = sourceContext.createLinearGradient(target.x, target.y, target.x + target.width, target.y + target.height);
    gradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`);
    gradient.addColorStop(0.5, `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`);
    gradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`);
    sourceContext.save();
    sourceContext.filter = `blur(${Math.max(0, feather / 4)}px)`;
    sourceContext.fillStyle = gradient;
    sourceContext.fillRect(target.x, target.y, target.width, target.height);
    sourceContext.restore();

    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => source.toBlob(resolve, outputType, 0.94));
    if (!blob) {
      toast.error("Watermark cleanup could not create an output image.");
      return;
    }

    const cleanedName = file.name.replace(/(\.[^.]+)?$/, "_watermark_removed$1");
    onApply(new File([blob], cleanedName, { type: outputType, lastModified: Date.now() }));
    toast.success("Watermark cleanup applied locally.");
    onOpenChange(false);
  };

  const isImage = Boolean(file?.type.startsWith("image/"));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl border-white/10 bg-[#08111f] text-white shadow-2xl shadow-cyan-950/40">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300"><Eraser className="h-5 w-5" /></div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight">Watermark Studio</DialogTitle>
              <DialogDescription className="mt-1 text-slate-400">
                Select a simple overlay on an image you own or are authorized to edit. Processing stays in this browser.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!isImage ? (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6 text-sm text-amber-100">
            Watermark cleanup is currently available for image files only. Choose a JPG, PNG, WEBP, GIF, BMP, or TIFF file.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-300">
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Private, in-browser editing</span>
              <Badge variant="outline" className="border-cyan-400/30 text-cyan-200">{file?.name}</Badge>
            </div>
            <div className="overflow-auto rounded-3xl border border-white/10 bg-black/30 p-3">
              <canvas
                ref={canvasRef}
                aria-label="Image watermark selection canvas"
                className="mx-auto block max-h-[62vh] max-w-full touch-none cursor-crosshair rounded-2xl"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="watermark-feather" className="text-xs font-bold uppercase tracking-widest text-slate-400">Blend softness</Label>
                  <span className="text-xs tabular-nums text-cyan-200">{feather}px</span>
                </div>
                <Slider id="watermark-feather" min={0} max={40} step={1} value={[feather]} onValueChange={(value) => setFeather(value[0] ?? 12)} aria-label="Watermark blend softness" />
                <p className="text-xs text-slate-500">Best for small logos or text on relatively even backgrounds. Complex scenes may need a dedicated retouching tool.</p>
              </div>
              <Button variant="outline" onClick={resetSelection} className="border-white/10 text-slate-200 hover:bg-white/5"><RotateCcw className="mr-2 h-4 w-4" />Reset selection</Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-300 hover:bg-white/5">Cancel</Button>
          {isImage && <Button onClick={handleApply} disabled={!isReady || !selection} className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"><CheckCircle2 className="mr-2 h-4 w-4" />Apply locally</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
