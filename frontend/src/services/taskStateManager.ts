// Task State Machine & Trophy Economy System
// Manages states: not_started -> in_progress -> failed_attempt / completed
// Deducts -25 trophies on failure, awards +250 trophies on completion, permanently locks completed tasks.

export type TaskStatus = 'not_started' | 'in_progress' | 'failed_attempt' | 'completed';

export interface TaskRecord {
  taskId: string;
  status: TaskStatus;
  failedAttempts: number;
  awardedTrophies: boolean;
  completedAt?: number;
}

export interface TeamTaskData {
  tasks: Record<string, TaskRecord>;
  trophyDelta: number; // Net trophies earned/lost via room tasks & hazards
}

const STORAGE_KEY_PREFIX = 'cyber_vault_task_states_';

export class TaskStateManager {
  private static getKey(teamId: string): string {
    return `${STORAGE_KEY_PREFIX}${teamId || 'default'}`;
  }

  public static getTeamData(teamId: string): TeamTaskData {
    try {
      const raw = localStorage.getItem(this.getKey(teamId));
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}

    return {
      tasks: {},
      trophyDelta: 0,
    };
  }

  private static saveTeamData(teamId: string, data: TeamTaskData): void {
    try {
      localStorage.setItem(this.getKey(teamId), JSON.stringify(data));
    } catch {}
  }

  public static getTaskRecord(teamId: string, taskId: string): TaskRecord {
    const data = this.getTeamData(teamId);
    return (
      data.tasks[taskId] || {
        taskId,
        status: 'not_started',
        failedAttempts: 0,
        awardedTrophies: false,
      }
    );
  }

  public static isTaskCompleted(teamId: string, taskId: string): boolean {
    const record = this.getTaskRecord(teamId, taskId);
    return record.status === 'completed';
  }

  public static getCompletedTaskIds(teamId: string): string[] {
    const data = this.getTeamData(teamId);
    return Object.keys(data.tasks).filter((id) => data.tasks[id].status === 'completed');
  }

  /**
   * Called when player opens or begins interacting with a task.
   */
  public static startTask(teamId: string, taskId: string): TaskRecord {
    const data = this.getTeamData(teamId);
    const existing = data.tasks[taskId];

    if (existing && existing.status === 'completed') {
      return existing; // Cannot downgrade completed task
    }

    const updated: TaskRecord = existing
      ? { ...existing, status: 'in_progress' }
      : { taskId, status: 'in_progress', failedAttempts: 0, awardedTrophies: false };

    data.tasks[taskId] = updated;
    this.saveTeamData(teamId, data);
    return updated;
  }

  /**
   * Called when player fails a task attempt or triggers a room hazard.
   * Deducts a minimum of 25 trophies (compounding per mistake).
   * Task state transitions to 'failed_attempt', remaining in 'in_progress' for retry.
   */
  public static recordFailure(teamId: string, taskId: string, penalty = 25): { newScoreDelta: number; taskRecord: TaskRecord } {
    const data = this.getTeamData(teamId);
    const existing = data.tasks[taskId] || {
      taskId,
      status: 'in_progress' as TaskStatus,
      failedAttempts: 0,
      awardedTrophies: false,
    };

    if (existing.status === 'completed') {
      return { newScoreDelta: data.trophyDelta, taskRecord: existing };
    }

    existing.failedAttempts += 1;
    existing.status = 'failed_attempt';
    data.tasks[taskId] = existing;
    data.trophyDelta -= penalty;

    this.saveTeamData(teamId, data);

    // After recording failure, the task stays in_progress for retry
    setTimeout(() => {
      const fresh = this.getTeamData(teamId);
      if (fresh.tasks[taskId] && fresh.tasks[taskId].status === 'failed_attempt') {
        fresh.tasks[taskId].status = 'in_progress';
        this.saveTeamData(teamId, fresh);
      }
    }, 100);

    return { newScoreDelta: data.trophyDelta, taskRecord: existing };
  }

  /**
   * Called when player successfully solves a room task.
   * Awards +250 trophies exactly once, and permanently locks the task to 'completed'.
   */
  public static recordCompletion(
    teamId: string,
    taskId: string,
    reward = 250
  ): { newlyCompleted: boolean; newScoreDelta: number; taskRecord: TaskRecord } {
    const data = this.getTeamData(teamId);
    const existing = data.tasks[taskId] || {
      taskId,
      status: 'in_progress' as TaskStatus,
      failedAttempts: 0,
      awardedTrophies: false,
    };

    let newlyCompleted = false;

    if (existing.status !== 'completed' && !existing.awardedTrophies) {
      newlyCompleted = true;
      existing.awardedTrophies = true;
      existing.status = 'completed';
      existing.completedAt = Date.now();
      data.trophyDelta += reward;
    } else {
      existing.status = 'completed';
    }

    data.tasks[taskId] = existing;
    this.saveTeamData(teamId, data);

    return { newlyCompleted, newScoreDelta: data.trophyDelta, taskRecord: existing };
  }

  /**
   * Reset all tasks for a fresh event run.
   */
  public static resetAll(teamId: string): void {
    try {
      localStorage.removeItem(this.getKey(teamId));
    } catch {}
  }
}
