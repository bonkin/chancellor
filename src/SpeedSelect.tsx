import React, {useEffect, useRef, useState} from "react";

type ExplorerSpeed = 'ultraBullet' | 'bullet' | 'blitz' | 'rapid' | 'classical' | 'correspondence';
const ALL_SPEEDS: ExplorerSpeed[] = ['ultraBullet', 'bullet', 'blitz', 'rapid', 'classical', 'correspondence'];

interface SpeedSelectProps {
    selectedSpeeds: ExplorerSpeed[];
    onSpeedChange: (speeds: ExplorerSpeed[]) => void;
}

/**
 * The `SpeedSelect` component allows users to filter games based on time controls.
 *
 * Lichess classifies games into categories according to the total time each player starts with:
 *
 * - UltraBullet: Less than 30 seconds.
 * - Bullet: 30 seconds to 2:59.
 * - Blitz: 3:00 to 7:59.
 * - Rapid: 8:00 to 24:59.
 * - Classical: 25:00 and above.
 * - Correspondence: At least one day per move.
 *
 * Total time is derived from base time and the increment over the initial 40 moves.
 * Example: A time control of 5 minutes + 3 seconds/move equates to 5 minutes + (3 seconds * 40) = 7 minutes.
 */
const SpeedSelect: React.FC<SpeedSelectProps> = ({ selectedSpeeds, onSpeedChange }) => {
    const [dragStart, setDragStart] = useState<ExplorerSpeed | null>(null);
    const [displayAsIcons, setDisplayAsIcons] = useState(false);

    const speedRefs = useRef<Record<ExplorerSpeed, HTMLButtonElement | null>>({
        ultraBullet: null,
        bullet: null,
        blitz: null,
        rapid: null,
        classical: null,
        correspondence: null,
    });

    const checkOverflow = () => {
        for (const speed of ALL_SPEEDS) {
            const btn = speedRefs.current[speed];
            if (btn && btn.scrollWidth > btn.offsetWidth) {
                setDisplayAsIcons(true);
                return;
            }
        }
        setDisplayAsIcons(false);
    };

    useEffect(() => {
        checkOverflow();

        window.addEventListener('resize', checkOverflow);
        return () => {
            window.removeEventListener('resize', checkOverflow);
        };
    }, []);

    const toggleSpeed = (speed: ExplorerSpeed) => {
        if (selectedSpeeds.includes(speed)) {
            // If the selected speed is either the highest or the lowest in the current selected range
            if (speed === ALL_SPEEDS[Math.max(...selectedSpeeds.map(s => ALL_SPEEDS.indexOf(s)))] ||
                speed === ALL_SPEEDS[Math.min(...selectedSpeeds.map(s => ALL_SPEEDS.indexOf(s)))]) {
                const newSpeeds = selectedSpeeds.filter(s => s !== speed);
                if (newSpeeds.length > 0) {
                    onSpeedChange(newSpeeds);
                }
            } // else do nothing, as deselecting middle speeds is not allowed
        } else {
            const selectedIndex = ALL_SPEEDS.indexOf(speed);
            let newSpeeds = [speed];
            for (let i = selectedIndex - 1; i >= 0; i--) {
                if (selectedSpeeds.includes(ALL_SPEEDS[i])) {
                    newSpeeds.unshift(ALL_SPEEDS[i]);
                } else {
                    break;
                }
            }
            for (let i = selectedIndex + 1; i < ALL_SPEEDS.length; i++) {
                if (selectedSpeeds.includes(ALL_SPEEDS[i])) {
                    newSpeeds.push(ALL_SPEEDS[i]);
                } else {
                    break;
                }
            }
            onSpeedChange(newSpeeds);
        }
    }

    const handleMouseDown = (speed: ExplorerSpeed) => {
        setDragStart(speed);
    }

    const handleMouseUp = () => {
        setDragStart(null);
    }

    const handleMouseEnter = (speed: ExplorerSpeed) => {
        if (dragStart !== null) {
            const startIndex = ALL_SPEEDS.indexOf(dragStart);
            const endIndex = ALL_SPEEDS.indexOf(speed);
            const newSpeeds = ALL_SPEEDS.slice(
                Math.min(startIndex, endIndex),
                Math.max(startIndex, endIndex) + 1
            );
            onSpeedChange(newSpeeds);
        }
    }

    const getTooltipText = (speed: ExplorerSpeed) => {
        const prefix = speed.charAt(0).toUpperCase() + speed.slice(1) + ': ';
        switch (speed) {
            case 'ultraBullet': return prefix + '< 30s';
            case 'bullet': return prefix + '30s - 3min';
            case 'blitz': return prefix + '3min - 8min';
            case 'rapid': return prefix + '8min - 25min';
            case 'classical': return prefix + '> 25min';
            case 'correspondence': return prefix + '1+ day/move';
        }
    }

    const getSpeedIcon = (speed: ExplorerSpeed): string => {
        switch (speed) {
            case 'ultraBullet':
                return '🚀';
            case 'bullet':
                return '💨';
            case 'blitz':
                return '🔥';
            case 'rapid':
                return '🐇';
            case 'classical':
                return '🐢';
            case 'correspondence':
                return '📬';
        }
    };

    return (
        <div className="flex speedSelect">
            {ALL_SPEEDS.map((speed, index) => (
                <button
                    key={speed}
                    ref={(ref) => (speedRefs.current[speed] = ref)}
                    style={{ minWidth: '30px' }}
                    onMouseDown={() => handleMouseDown(speed)}
                    onMouseUp={handleMouseUp}
                    onMouseEnter={() => handleMouseEnter(speed)}
                    onClick={() => toggleSpeed(speed)}
                    className={`
                        flex-1 px-1 py-1 text-xs 
                        ${index === 0 ? 'rounded-bl-md' : ''} 
                        ${index === ALL_SPEEDS.length - 1 ? 'rounded-br-md' : ''} 
                        focus:outline-none 
                        ${selectedSpeeds.includes(speed) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}
                    `}
                >
                    <span className="tooltip">
                        {displayAsIcons ? getSpeedIcon(speed) : speed.charAt(0).toUpperCase() + speed.slice(1)}
                        <span className="tooltiptext">{getTooltipText(speed)}</span>
                    </span>
                </button>
            ))}
        </div>
    );
}

export default SpeedSelect;
export type {ExplorerSpeed};
export {ALL_SPEEDS};
