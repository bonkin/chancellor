import React, {useState} from "react";

type Rating = 400 | 1000 | 1200 | 1400 | 1600 | 1800 | 2000 | 2200 | 2500;
const ALL_RATINGS: Rating[] = [400, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500];

interface RatingSelectProps {
    selectedRating: Rating[];
    onRatingChange: (ratings: Rating[]) => void;
}

const RatingSelect: React.FC<RatingSelectProps> = ({selectedRating, onRatingChange}) => {

    const [dragStart, setDragStart] = useState<Rating | null>(null);

    const toggleRating = (rating: Rating) => {
        if (selectedRating.includes(rating)) {
            // If the selected rating is either the highest or the lowest in the current selected range
            if (rating === Math.max(...selectedRating) || rating === Math.min(...selectedRating)) {
                const newRatings = selectedRating.filter(r => r !== rating);
                if (newRatings.length > 0) {
                    onRatingChange(newRatings);
                }
            } // else do nothing, as deselecting middle ratings is not allowed
        } else {
            const selectedIndex = ALL_RATINGS.indexOf(rating);
            let newRatings = [rating];
            for (let i = selectedIndex - 1; i >= 0; i--) {
                if (selectedRating.includes(ALL_RATINGS[i])) {
                    newRatings.unshift(ALL_RATINGS[i]);
                } else {
                    break;
                }
            }
            for (let i = selectedIndex + 1; i < ALL_RATINGS.length; i++) {
                if (selectedRating.includes(ALL_RATINGS[i])) {
                    newRatings.push(ALL_RATINGS[i]);
                } else {
                    break;
                }
            }
            onRatingChange(newRatings);
        }
    }

    const handleMouseDown = (rating: Rating) => {
        setDragStart(rating);
    }

    const handleMouseUp = () => {
        setDragStart(null); // Reset drag start
    }

    const handleMouseEnter = (rating: Rating) => {
        if (dragStart !== null) {
            const startIndex = ALL_RATINGS.indexOf(dragStart);
            const endIndex = ALL_RATINGS.indexOf(rating);
            const newRatings = ALL_RATINGS.slice(
                Math.min(startIndex, endIndex),
                Math.max(startIndex, endIndex) + 1
            );
            onRatingChange(newRatings);
        }
    }

    const getTooltipText = (rating: Rating) => {
        const index = ALL_RATINGS.indexOf(rating);
        if (index === ALL_RATINGS.length - 1) {
            return `≥${rating}`;
        }
        return `${rating}-${ALL_RATINGS[index+1]-1}`;
    }

    return (
        <div className="flex">
            {ALL_RATINGS.map((rating, index) => (
                <button
                    key={rating}
                    style={{minWidth: '30px'}}
                    onMouseDown={() => handleMouseDown(rating)}
                    onMouseUp={handleMouseUp}
                    onMouseEnter={() => handleMouseEnter(rating)}
                    onClick={() => toggleRating(rating)}
                    className={`
                        flex-1 px-1 py-1 text-xs 
                        ${index === 0 ? 'rounded-tl-md' : ''} 
                        ${index === ALL_RATINGS.length - 1 ? 'rounded-tr-md' : ''} 
                        focus:outline-none 
                        ${selectedRating.includes(rating) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}
                    `}
                >
                    <span className="tooltip">
                        {index === ALL_RATINGS.length - 1 ? <small>≥</small> : null}
                        {rating}
                        <span className="tooltiptext">{getTooltipText(rating)}</span>
                    </span>
                </button>
            ))}
        </div>
    );
}

export default RatingSelect;
export type {Rating};
export {ALL_RATINGS};
