export interface ActionLease {
  actionId: string
  release(): void
}

export class ActionMutex {
  private activeActionId: string | null = null

  public acquire(actionId: string): ActionLease | null {
    if (this.activeActionId !== null) {
      return null
    }

    this.activeActionId = actionId

    return {
      actionId,
      release: () => {
        if (this.activeActionId === actionId) {
          this.activeActionId = null
        }
      },
    }
  }

  public getActiveActionId(): string | null {
    return this.activeActionId
  }

  public isLocked(): boolean {
    return this.activeActionId !== null
  }
}
