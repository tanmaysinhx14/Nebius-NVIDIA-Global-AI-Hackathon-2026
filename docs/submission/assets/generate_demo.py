from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1280, 720, 24
ASSET_DIR = Path(__file__).resolve().parent
SHOT = ASSET_DIR / 'tracekit-preview.png'
OUT = ASSET_DIR / 'Tracekit-Demo-Walkthrough.mp4'
FONT = r'C:\Windows\Fonts\segoeui.ttf'
BOLD = r'C:\Windows\Fonts\seguisb.ttf'

INK, MUTED, GREEN = '#12251d', '#53665c', '#178150'
PALE, WHITE, LINE, BLUE, AMBER = '#f1f6f2', '#ffffff', '#dce7de', '#446b93', '#c2852c'
font = ImageFont.truetype(FONT, 24)
small = ImageFont.truetype(FONT, 18)
body = ImageFont.truetype(FONT, 25)
strong = ImageFont.truetype(BOLD, 30)
subhead = ImageFont.truetype(BOLD, 36)
mini = ImageFont.truetype(BOLD, 16)


def canvas(eyebrow='TRACEKIT · PROTOTYPE WALKTHROUGH'):
    im = Image.new('RGB', (W, H), PALE)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W, 10), fill=GREEN)
    d.text((54, 35), eyebrow, font=mini, fill=GREEN)
    d.text((54, 676), 'TRACEKIT  ·  STUDENT DEBUGGING COPILOT', font=mini, fill=MUTED)
    return im, d


def wrapped(draw, xy, text, f, fill, width, spacing=8):
    x, y = xy
    lines, line = [], ''
    for word in text.split():
        candidate = (line + ' ' + word).strip()
        if draw.textbbox((0, 0), candidate, font=f)[2] <= width:
            line = candidate
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    for item in lines:
        draw.text((x, y), item, font=f, fill=fill)
        y += draw.textbbox((0, 0), item, font=f)[3] + spacing
    return y


def card(im, box, fill=WHITE, outline=LINE, radius=22):
    ImageDraw.Draw(im).rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=2)


def title_scene():
    im, d = canvas()
    d.ellipse((890, -170, 1390, 330), fill='#e1eee4')
    d.ellipse((1020, 390, 1450, 820), fill='#e5edf1')
    d.text((72, 170), 'Tracekit', font=ImageFont.truetype(BOLD, 84), fill=INK)
    d.text((78, 280), 'Find the why. Fix the right thing.', font=subhead, fill=GREEN)
    wrapped(d, (80, 358), 'A debugging copilot prototype for students working through compiler and runtime errors.', body, MUTED, 820, 12)
    card(im, (80, 500, 520, 568), fill=WHITE)
    ImageDraw.Draw(im).text((104, 519), 'REAL INTERFACE · NO MOCKED OUTPUT', font=mini, fill=INK)
    return im


def workspace_scene():
    im, d = canvas('01  ·  THE WORKSPACE')
    d.text((54, 76), 'Start with the error and nearby code', font=subhead, fill=INK)
    shot = Image.open(SHOT).convert('RGB')
    shot.thumbnail((1170, 460), Image.Resampling.LANCZOS)
    x, y = (W - shot.width) // 2, 148
    card(im, (x-8, y-8, x+shot.width+8, y+shot.height+8), fill=WHITE, radius=14)
    im.paste(shot, (x, y))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((54, 620, 1225, 660), radius=12, fill='#e4f1e8')
    d.text((72, 630), 'Built-in Python example  ·  query preview visible  ·  no analysis request sent', font=small, fill=INK)
    return im


def pipeline_scene():
    im, d = canvas('02  ·  THE PIPELINE')
    d.text((54, 82), 'A staged path from error to proposed change', font=subhead, fill=INK)
    d.text((56, 141), 'Implemented design; live model output is not shown in this video.', font=small, fill=MUTED)
    boxes = [
        ((38, 285, 278, 445), 'STUDENT INPUT', 'Error + code', AMBER),
        ((360, 160, 610, 305), 'NVIDIA NEMOTRON NANO', 'Triage the error', GREEN),
        ((360, 420, 610, 565), 'TAVILY SEARCH', 'Redacted signature', BLUE),
        ((710, 285, 960, 445), 'NVIDIA NEMOTRON SUPER', 'Explain and propose', GREEN),
        ((1000, 285, 1240, 445), 'STUDENT', 'Review and verify', AMBER),
    ]
    for (x1,y1,x2,y2), heading, caption, color in boxes:
        card(im, (x1,y1,x2,y2), fill=WHITE, outline=color, radius=20)
        d.text((x1+18,y1+34), heading, font=mini, fill=color)
        wrapped(d,(x1+18,y1+74),caption,body,INK,x2-x1-36,6)
    def arrow(points, color):
        d.line(points, fill=color, width=5, joint='curve')
        x2,y2=points[-1]
        d.polygon([(x2,y2),(x2-13,y2-8),(x2-13,y2+8)], fill=color)
    arrow([(278,365),(320,365),(320,232),(360,232)], GREEN)
    arrow([(278,365),(320,365),(320,492),(360,492)], BLUE)
    arrow([(610,232),(670,232),(670,330),(710,330)], GREEN)
    arrow([(610,492),(670,492),(670,400),(710,400)], BLUE)
    arrow([(960,365),(1000,365)], GREEN)
    d.text((54, 595), 'No submitted code execution. A proposed fix is not proof that the program passes.', font=small, fill=MUTED)
    return im


def privacy_scene():
    im, d = canvas('03  ·  DATA BOUNDARIES')
    d.text((54, 82), 'Different stages receive different data', font=subhead, fill=INK)
    card(im,(56,174,614,500),fill=WHITE,outline=GREEN)
    card(im,(666,174,1224,500),fill=WHITE,outline=BLUE)
    d.text((88,210),'NEBIUS TOKEN FACTORY',font=mini,fill=GREEN)
    d.text((88,266),'Full error + nearby code',font=strong,fill=INK)
    wrapped(d,(88,324),'Sent only when a live analysis is started. The request uses server-side credentials.',font,MUTED,450,10)
    d.text((698,210),'TAVILY SEARCH',font=mini,fill=BLUE)
    d.text((698,266),'Short redacted query',font=strong,fill=INK)
    wrapped(d,(698,324),'The code is not sent to Tavily. Pattern filters can miss secrets, so the query preview remains visible.',font,MUTED,450,10)
    d.rounded_rectangle((56,548,1224,616),radius=16,fill='#fff4df')
    d.text((80,568),'This recording does not start a provider request or include any model-generated answer.',font=small,fill=INK)
    return im


def verification_scene():
    im, d = canvas('04  ·  HUMAN VERIFICATION')
    d.text((54, 84), 'The student stays in control', font=subhead, fill=INK)
    steps = [
      ('01','Inspect the explanation','Check the error category and evidence.'),
      ('02','Review the proposed diff','Apply only changes you understand.'),
      ('03','Run the program yourself','Verify the fix and nearby edge cases.'),
    ]
    y=184
    for number, heading, caption in steps:
        card(im,(70,y,1210,y+116),fill=WHITE)
        d.ellipse((98,y+28,158,y+88),fill='#e2f1e7')
        d.text((113,y+44),number,font=mini,fill=GREEN)
        d.text((188,y+25),heading,font=strong,fill=INK)
        d.text((188,y+68),caption,font=small,fill=MUTED)
        y+=140
    d.text((72,625),'Tracekit does not run student code. The manual check is self-reported.',font=small,fill=MUTED)
    return im


def limits_scene():
    im, d = canvas('05  ·  VALIDATION STATUS')
    d.text((54, 84), 'What this demo verifies — and what it does not', font=subhead, fill=INK)
    card(im,(60,170,1220,542),fill=WHITE)
    d.text((96,210),'VERIFIED',font=mini,fill=GREEN)
    d.text((96,253),'Local lint and production build pass',font=strong,fill=INK)
    d.text((96,308),'Account-visible Nano and Super IDs were listed',font=body,fill=MUTED)
    d.text((96,354),'One Tavily basic search returned one reference',font=body,fill=MUTED)
    d.line((96,408,1180,408),fill=LINE,width=2)
    d.text((96,438),'NOT RUN',font=mini,fill=AMBER)
    wrapped(d,(96,478),'Nebius inference: account balance was $0 and the model is metered. No output, accuracy, latency, token use, or fix success is claimed.',small,MUTED,1040,8)
    return im


def closing_scene():
    im,d=canvas()
    d.ellipse((850,370,1370,890),fill='#e1eee4')
    d.text((74,170),'Tracekit',font=ImageFont.truetype(BOLD,74),fill=INK)
    d.text((80,272),'A clearer debugging path,',font=subhead,fill=GREEN)
    d.text((80,320),'with verification left to the student.',font=subhead,fill=GREEN)
    d.text((82,425),'Prototype walkthrough · no model result was simulated',font=body,fill=MUTED)
    d.text((82,487),'Next: live inference only when free credit is available.',font=small,fill=MUTED)
    return im


scenes = [(title_scene(),6),(workspace_scene(),12),(pipeline_scene(),10),(privacy_scene(),10),(verification_scene(),9),(limits_scene(),10),(closing_scene(),6)]
writer = cv2.VideoWriter(str(OUT), cv2.VideoWriter_fourcc(*'mp4v'), FPS, (W,H))
if not writer.isOpened():
    raise RuntimeError('OpenCV could not open the MP4 writer.')
black = np.zeros((H,W,3), dtype=np.uint8)
for image, seconds in scenes:
    bgr = cv2.cvtColor(np.asarray(image.convert('RGB')), cv2.COLOR_RGB2BGR)
    total, fade = seconds*FPS, int(0.25*FPS)
    for frame_no in range(total):
        alpha = min(1.0, (frame_no+1)/fade, (total-frame_no)/fade)
        frame = cv2.addWeighted(bgr, alpha, black, 1-alpha, 0) if alpha < 1 else bgr
        writer.write(frame)
writer.release()
print(f'Created: {OUT}')
print(f'Duration: {sum(s for _,s in scenes)} seconds; {W}x{H}; {FPS} fps')
print(f'Bytes: {OUT.stat().st_size}')
