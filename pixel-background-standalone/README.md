# Pixel Background Component

Анимированный пиксельный фон с использованием WebGL шейдеров.

## Установка

```bash
npm install @paper-design/shaders-react
```

## Использование

Скопируй `pixel-background.tsx` в папку `components` твоего проекта.

```tsx
import { PixelBackground } from "@/components/pixel-background"

export default function Page() {
  return (
    <div className="relative min-h-screen">
      <PixelBackground />
      
      {/* Твой контент поверх бэкграунда */}
      <div className="relative z-10">
        <h1>Hello World</h1>
      </div>
    </div>
  )
}
```

## Props

| Prop | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `colorFront` | `string` | `"#005B5B"` | Цвет пикселей |
| `colorBack` | `string` | `"#00000000"` | Цвет фона паттерна (прозрачный) |
| `speed` | `number` | `0.43` | Скорость анимации |
| `shape` | `"wave" \| "simplex" \| "circle" \| "square"` | `"wave"` | Форма анимации |
| `type` | `"2x2" \| "4x4" \| "8x8"` | `"4x4"` | Тип dithering паттерна |
| `pxSize` | `number` | `3` | Размер пикселя |
| `scale` | `number` | `1.13` | Масштаб паттерна |
| `backgroundColor` | `string` | `"#000000"` | Цвет фона контейнера |
| `className` | `string` | `""` | Дополнительные CSS классы |

## Примеры

### Синий фон
```tsx
<PixelBackground colorFront="#0066FF" backgroundColor="#001133" />
```

### Быстрая анимация
```tsx
<PixelBackground speed={1.5} />
```

### Другой паттерн
```tsx
<PixelBackground shape="simplex" type="8x8" pxSize={5} />
```

## Требования

- React 18+
- Next.js 13+ (App Router с `"use client"`)
- Tailwind CSS (для классов `fixed`, `inset-0`, etc.)
