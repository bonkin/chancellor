class TimeFormatter {
    static formatTime(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const sec = seconds % 60;

        let timeString = '';

        if (hours > 0) {
            timeString += `${hours} hour${hours !== 1 ? 's' : ''} `;
        }

        if (minutes > 0) {
            timeString += `${minutes} minute${minutes !== 1 ? 's' : ''} `;
        }

        if (sec > 0 || timeString === '') { // if no hours or minutes, show the seconds even if it's zero
            timeString += `${sec} second${sec !== 1 ? 's' : ''}`;
        }

        return timeString.trim();
    }
}

export default TimeFormatter;
