import { color } from 'bun';
import React from 'react';
import { useBackend } from 'tgui/backend';
import { Window } from 'tgui/layouts';
import {
  Box,
  Button,
  LabeledList,
  NoticeBox,
  ProgressBar,
  Section,
} from 'tgui-core/components';

/* ================================================== */
/* Grid helpers                                        */
/* ================================================== */

const EMPTY_CELL = null;

const createEmptyGrid = (x: number, y: number) =>
  Array.from({ length: y }, () => Array(x).fill(EMPTY_CELL));

const normalizeGrid = (raw: any, gridX: number, gridY: number): any[][] => {
  // Already 2D
  if (Array.isArray(raw) && Array.isArray(raw[0])) {
    return raw;
  }

  // Flat array
  if (Array.isArray(raw) && raw.length === gridX * gridY) {
    return Array.from({ length: gridY }, (_, y) =>
      raw.slice(y * gridX, (y + 1) * gridX),
    );
  }

  // BYOND list / object
  if (raw && typeof raw === 'object') {
    const grid = createEmptyGrid(gridX, gridY);

    for (const key of Object.keys(raw)) {
      // Numeric keys (1-based index)
      if (/^\d+$/.test(key)) {
        const idx = Number(key) - 1;
        const x = idx % gridX;
        const y = Math.floor(idx / gridX);
        if (grid[y]?.[x] !== undefined) grid[y][x] = raw[key];
        continue;
      }

      // "x_y" or "x,y"
      const match = key.match(/(\d+)[_,](\d+)/);
      if (match) {
        const x = Number(match[1]) - 1;
        const y = Number(match[2]) - 1;
        if (grid[y]?.[x] !== undefined) grid[y][x] = raw[key];
      }
    }

    return grid;
  }

  return createEmptyGrid(gridX, gridY);
};

const COMPONENT_ICONS = {
  heat: { icon: 'H', color: '#ff4444' },
  moderator: { icon: 'M', color: '#4444ff' },
  control_rod: { icon: 'C', color: '#ffff00' },
  fuel: { icon: 'F', color: '#44ff44' },
  vent: { icon: 'V', color: '#ff88ff' },
};

const getComponentIcon = (cell: any) => {
  if (!cell) {
    return { icon: 'O', color: '#666' };
  }

  const name = typeof cell === 'string' ? cell : cell.type || cell.name || '';

  for (const key in COMPONENT_ICONS) {
    if (name.toLowerCase().includes(key)) {
      return COMPONENT_ICONS[key];
    }
  }

  return { icon: '?', color: '#ffffff' };
};

/* ================================================== */
/* Reactor Grid                                        */
/* ================================================== */

const ReactorGrid = ({ grid = [], gridX = 6, gridY = 6, onCellClick }) => {
  const matrix = React.useMemo(
    () => normalizeGrid(grid, gridX, gridY),
    [grid, gridX, gridY],
  );

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridX}, 40px)`,
        gridTemplateRows: `repeat(${gridY}, 40px)`,
        gap: '2px',
      }}
    >
      {matrix.map((row, y) =>
        row.map((cell, x) => {
          const { icon, color } = getComponentIcon(cell);
          return (
            <button
              key={`${x}-${y}`}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: cell ? '#4a4a4a' : '#2a2a2a',
                border: '1px solid #666',
                padding: 0,
                fontSize: '18px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                color,
              }}
              onClick={() => onCellClick?.(x, y)}
              title={
                cell
                  ? typeof cell === 'string'
                    ? cell
                    : cell.name || 'Component'
                  : 'Empty'
              }
            >
              {icon}
            </button>
          );
        }),
      )}
    </div>
  );
};

/* ================================================== */
/* Main UI                                             */
/* ================================================== */

export const ReactorUI = () => {
  const { data, act } = useBackend<any>();

  const gridX = data?.grid_x ?? 6;
  const gridY = data?.grid_y ?? 6;
  const grid = data?.grid ?? createEmptyGrid(gridX, gridY);

  return (
    <Window width={900} height={500}>
      <Window.Content>
        <div style={{ display: 'flex', height: '100%', gap: '10px' }}>
          <div
            style={{
              padding: '10px',
              backgroundColor: '#1a1a1a',
              borderRadius: '4px',
            }}
          >
            <ReactorGrid
              grid={grid}
              gridX={gridX}
              gridY={gridY}
              onCellClick={(x, y) =>
                act('reactor', {
                  action: 'click_slot',
                  x: x + 1,
                  y: y + 1,
                })
              }
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
            <ControlsContent />
          </div>
        </div>
      </Window.Content>
    </Window>
  );
};

/* ================================================== */
/* Controls                                            */
/* ================================================== */

export const ControlsContent = () => {
  const { act, data } = useBackend<any>();
  const [coverDown, setCoverDown] = React.useState(true);

  return (
    <>
      <Section width="100%">
        <LabeledList>
          <LabeledList.Item>
            <ReactorStatusPanel
              online={data.active}
              temperature={data.temperature}
              maxTemperature={data.max_temperature}
              power={data.raw_last_power_output}
              maxPower={data.safeties_max_power_generation}
            />
          </LabeledList.Item>
        </LabeledList>
      </Section>

      <Section title="Controls" textAlign="center">
        <LabeledList> Buttons </LabeledList>
      </Section>
    </>
  );
};

const ReactorStatusPanel = ({
  online,
  temperature,
  maxTemperature,
  power,
  maxPower,
}) => {
  const tempPercent = Math.min(100, (temperature / maxTemperature) * 100);
  const powerPercent = Math.min(100, (power / maxPower) * 100);

  const tempColor =
    tempPercent > 85 ? '#ff4d4d' : tempPercent > 65 ? '#ffb84d' : '#66ffcc';

  const powerColor =
    powerPercent > 80 ? '#66ffcc' : powerPercent > 40 ? '#6fbaff' : '#888';
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'stretch',
        width: '100%',
        maxWidth: '420px',
        padding: 12,
        background: '#0b1216',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: 6,
        color: '#cfefff',
      }}
    >
      {/* Left: vertical bars */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: '#9fc4ff',
            fontWeight: 700,
          }}
        >
          CORE TEMP
        </div>
        <div
          style={{
            width: 44,
            height: 160,
            background: '#00131a',
            borderRadius: 8,
            border: '1px solid #0b2a34',
            position: 'relative',
            boxShadow: `0 0 16px ${tempColor}33`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 6,
              left: 6,
              right: 6,
              height: `${tempPercent}%`,
              background: `linear-gradient(180deg, ${tempColor}, #220000)`,
              borderRadius: 6,
              boxShadow: `0 0 18px ${tempColor}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 6,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: 11,
              color: '#9fc4ff',
            }}
          >
            {Math.round(temperature)}K
          </div>
        </div>

        <div
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: '#9fc4ff',
            fontWeight: 700,
          }}
        >
          POWER
        </div>
        <div
          style={{
            width: 44,
            height: 120,
            background: '#001018',
            borderRadius: 8,
            border: '1px solid #07202a',
            position: 'relative',
            boxShadow: `0 0 12px ${powerColor}33`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 6,
              left: 6,
              right: 6,
              height: `${powerPercent}%`,
              background: `linear-gradient(180deg, ${powerColor}, #00141a)`,
              borderRadius: 6,
              boxShadow: `0 0 12px ${powerColor}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 6,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: 11,
              color: '#9fc4ff',
            }}
          >
            {Math.round(power)} MW
          </div>
        </div>
      </div>

      {/* Right: header + stats */}
      <div
        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 1 }}>
            REACTOR STATUS
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: online ? '#66ffcc' : '#ff4d4d',
                boxShadow: online ? '0 0 10px #66ffcc' : '0 0 10px #ff6b6b',
              }}
            />
            <div
              style={{
                fontSize: 12,
                color: online ? '#baf7e6' : '#ffb4b4',
                fontWeight: 700,
              }}
            >
              {online ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: '#9aaec7', marginBottom: 6 }}>
              CRITICALITY
            </div>
            <StatusBar
              label={''}
              value={Math.round((tempPercent + powerPercent) / 2)}
              max={100}
              unit="%"
              percent={Math.round((tempPercent + powerPercent) / 2)}
              color={tempColor}
              animated={online}
            />
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#9aaec7', marginBottom: 6 }}>
              INTEGRITY
            </div>
            <StatusBar
              label={''}
              value={Math.max(0, 100 - tempPercent / 1.2)}
              max={100}
              unit="%"
              percent={Math.max(0, 100 - tempPercent / 1.2)}
              color={powerColor}
              animated={online}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  color: '#9aaec7',
                  backgroundColor: '#171717',
                }}
              >
                EFFICIENCY
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#e6f9ff',
                  backgroundColor: '#171717',
                }}
              >
                --%
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  color: '#9aaec7',
                  backgroundColor: '#171717',
                }}
              >
                LAST OUTPUT
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#e6f9ff',
                  backgroundColor: '#171717',
                }}
              >
                -- MW
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'auto', fontSize: 12, color: '#98b6c9' }}>
          Temperature: {temperature}K · Max: {maxTemperature}K
        </div>
      </div>
    </div>
  );
};

const StatusBar = ({ label, value, max, unit, percent, color, animated }) => {
  const wobble = animated ? 'reactor-wobble 1.8s ease-in-out infinite' : 'none';

  return (
    <div style={{ marginBottom: '12px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#ccc',
          marginBottom: '4px',
        }}
      >
        <span>{label}</span>
        <span style={{ color }}>
          {value} / {max} {unit}
        </span>
      </div>

      <div
        style={{
          height: '14px',
          background: '#0a0a0a',
          border: '1px solid #333',
          borderRadius: '6px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            background: `linear-gradient(90deg, ${color}, #232323)`,
            boxShadow: `0 0 10px ${color}`,
            animation: wobble,
          }}
        />
      </div>
    </div>
  );
};

/* animation injected once */
const style = document.createElement('style');
style.innerHTML = `
@keyframes reactor-wobble {
  0% { filter: brightness(0.95); }
  50% { filter: brightness(1.1); }
  100% { filter: brightness(0.95); }
}
`;
document.head.appendChild(style);

export default ReactorStatusPanel;
