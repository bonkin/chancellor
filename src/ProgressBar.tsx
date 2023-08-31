import React from 'react';

interface ProgressBarProps {
    isCalculating: boolean;
    progress: number;
    estimatedLeaves: number;
    title: string | undefined;
}

class ProgressBar extends React.Component<ProgressBarProps> {
    render() {
        let {isCalculating, progress, estimatedLeaves, title} = this.props;
        const percentage = isCalculating ? (progress / estimatedLeaves) * 100 : estimatedLeaves ? 100 : 0;

        return (
            <div title={title} className="relative pt-0">
                <div className="overflow-hidden h-2 text-xs flex bg-transparent mb-4">
                    <div
                        style={{width: `${percentage}%`}}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-600 transition-all duration-500 ease-in-out ${isCalculating ? 'reversed-shimmer-effect' : ''}`}
                    >
                    </div>
                </div>
            </div>
        );
    }
}

export default ProgressBar;
