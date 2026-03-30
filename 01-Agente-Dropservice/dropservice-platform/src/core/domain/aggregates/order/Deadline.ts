import { AppError } from '@/core/shared/AppError';
import { Result, ok, fail } from '@/core/shared/Result';

export class Deadline {
    private constructor(
        private readonly _dueDate: Date,
        private readonly _createdAt: Date
    ) {}

    static create(dueDate: Date): Result<Deadline, AppError> {
        const createdAt = new Date();
        if (dueDate <= createdAt) {
            return fail(AppError.businessRule('Deadline must be in the future during creation'));
        }
        return ok(new Deadline(dueDate, createdAt));
    }

    static reconstitute(dueDate: Date, createdAt: Date): Deadline {
        // Reconstitution from persistence assumes valid data
        return new Deadline(dueDate, createdAt);
    }

    static fromDays(days: number): Result<Deadline, AppError> {
        if (days < 1 || days > 365) {
            return fail(AppError.businessRule('Deadline must be between 1 and 365 days'));
        }
        const due = new Date();
        due.setDate(due.getDate() + days);
        return ok(new Deadline(due, new Date()));
    }

    get dueDate(): Date { return new Date(this._dueDate); }

    isOverdue(): boolean {
        return new Date() > this._dueDate;
    }

    daysRemaining(): number {
        const diff = this._dueDate.getTime() - Date.now();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    isUrgent(thresholdDays = 2): boolean {
        return this.daysRemaining() <= thresholdDays && !this.isOverdue();
    }

    percentageElapsed(): number {
        const total = this._dueDate.getTime() - this._createdAt.getTime();
        const elapsed = Date.now() - this._createdAt.getTime();
        if (total <= 0) return 100;
        return Math.min(100, Math.round((elapsed / total) * 100));
    }

    extend(days: number): Result<Deadline, AppError> {
        if (days <= 0) {
            return fail(AppError.businessRule('Extension must be positive'));
        }
        const newDue = new Date(this._dueDate);
        newDue.setDate(newDue.getDate() + days);
        return ok(new Deadline(newDue, this._createdAt)); // Keep original creation date
    }

    toJSON() {
        return {
            dueDate: this._dueDate.toISOString(),
            createdAt: this._createdAt.toISOString()
        };
    }
}
