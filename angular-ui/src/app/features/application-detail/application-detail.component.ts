import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApplicationService } from '../../core/services/application.service';
import {
  Application,
  ApplicationStatus,
  CompanyCategory,
  JobSource,
  InterviewStage,
  APPLICATION_STATUSES,
  COMPANY_CATEGORIES,
  JOB_SOURCES,
} from '../../core/models/application.model';
import { HistoryPanelComponent } from '../history-panel/history-panel.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

interface FormState {
  companyName: string;
  positionTitle: string;
  dateApplied: string;
  status: ApplicationStatus;
  companyUrl: string;
  jobPostingUrl: string;
  companyCareerUrl: string;
  companyCategory: string;
  skillsMatch: string;
  jobSource: string;
  coverLetterRequired: boolean;
  salaryMin: string;
  salaryMax: string;
  specialRequirements: string;
  notes: string;
  offerDueDate: string;
}

interface FormErrors {
  companyName?: string;
  positionTitle?: string;
  companyUrl?: string;
  jobPostingUrl?: string;
  companyCareerUrl?: string;
  salaryMin?: string;
  salaryMax?: string;
  general?: string;
}

function initialFormState(): FormState {
  return {
    companyName: '',
    positionTitle: '',
    dateApplied: '',
    status: 'unsubmitted',
    companyUrl: '',
    jobPostingUrl: '',
    companyCareerUrl: '',
    companyCategory: '',
    skillsMatch: '',
    jobSource: '',
    coverLetterRequired: false,
    salaryMin: '',
    salaryMax: '',
    specialRequirements: '',
    notes: '',
    offerDueDate: '',
  };
}

function populateFromApplication(app: Application): FormState {
  return {
    companyName: app.companyName,
    positionTitle: app.positionTitle,
    dateApplied: app.dateApplied ?? '',
    status: app.status,
    companyUrl: app.companyUrl ?? '',
    jobPostingUrl: app.jobPostingUrl ?? '',
    companyCareerUrl: app.companyCareerUrl ?? '',
    companyCategory: app.companyCategory ?? '',
    skillsMatch: app.skillsMatch?.toString() ?? '',
    jobSource: app.jobSource ?? '',
    coverLetterRequired: app.coverLetterRequired ?? false,
    salaryMin: app.salaryMin?.toString() ?? '',
    salaryMax: app.salaryMax?.toString() ?? '',
    specialRequirements: app.specialRequirements ?? '',
    notes: app.notes ?? '',
    offerDueDate: app.offerDueDate ?? '',
  };
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.companyName.trim()) {
    errors.companyName = 'Company name is required';
  } else if (form.companyName.length > 200) {
    errors.companyName = 'Company name must be at most 200 characters';
  }

  if (!form.positionTitle.trim()) {
    errors.positionTitle = 'Position title is required';
  } else if (form.positionTitle.length > 200) {
    errors.positionTitle = 'Position title must be at most 200 characters';
  }

  if (form.companyUrl && !isValidUrl(form.companyUrl)) {
    errors.companyUrl = 'Invalid URL';
  }

  if (form.jobPostingUrl && !isValidUrl(form.jobPostingUrl)) {
    errors.jobPostingUrl = 'Invalid URL';
  }

  if (form.companyCareerUrl && !isValidUrl(form.companyCareerUrl)) {
    errors.companyCareerUrl = 'Invalid URL';
  }

  if (form.salaryMin && isNaN(parseInt(form.salaryMin, 10))) {
    errors.salaryMin = 'Invalid number';
  }

  if (form.salaryMax && isNaN(parseInt(form.salaryMax, 10))) {
    errors.salaryMax = 'Invalid number';
  }

  if (form.salaryMin && form.salaryMax) {
    const min = parseInt(form.salaryMin, 10);
    const max = parseInt(form.salaryMax, 10);
    if (!isNaN(min) && !isNaN(max) && min > max) {
      errors.salaryMin = 'Minimum salary must not exceed maximum';
    }
  }

  return errors;
}

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    HistoryPanelComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './application-detail.component.html',
})
export class ApplicationDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(ApplicationService);
  private subs = new Subscription();

  applicationId = signal<string | null>(null);
  isNew = computed(() => !this.applicationId());

  application = signal<Application | null>(null);
  loading = signal(false);
  saving = signal(false);

  form = signal<FormState>(initialFormState());
  snapshot = signal('');
  errors = signal<FormErrors>({});

  isDirty = computed(() => JSON.stringify(this.form()) !== this.snapshot());

  showHistory = signal(false);
  showDiscardConfirm = signal(false);
  showDeleteConfirm = signal(false);
  showAddStageForm = signal(false);
  editingStageId = signal<string | null>(null);

  localStages = signal<InterviewStage[]>([]);
  newStageName = signal('');
  editStageName = signal('');

  readonly statusOptions = APPLICATION_STATUSES;
  readonly categoryOptions = COMPANY_CATEGORIES;
  readonly sourceOptions = JOB_SOURCES;

  sortedStages = computed(() => {
    const app = this.application();
    const isNew = this.isNew();
    if (!isNew && app) {
      return [...app.interviewStages].sort((a, b) => a.order - b.order);
    }
    return [...this.localStages()].sort((a, b) => a.order - b.order);
  });

  nextOrder = computed(() => {
    const stages = this.sortedStages();
    if (stages.length === 0) return 0;
    return Math.max(...stages.map((s) => s.order)) + 1;
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.applicationId.set(id);
    if (id) {
      this.loadApplication(id);
    } else {
      const initial = initialFormState();
      this.form.set(initial);
      this.snapshot.set(JSON.stringify(initial));
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  loadApplication(id: string) {
    this.loading.set(true);
    this.service.get(id).subscribe({
      next: (app) => {
        this.application.set(app);
        const populated = populateFromApplication(app);
        this.form.set(populated);
        this.snapshot.set(JSON.stringify(populated));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    this.form.update((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'status') {
        if (value === 'unsubmitted') {
          next.dateApplied = '';
        } else if (prev.status === 'unsubmitted' && !prev.dateApplied) {
          next.dateApplied = getTodayDate();
        }
      }
      return next;
    });
  }

  onSubmit() {
    const validationErrors = validate(this.form());
    this.errors.set(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    this.saving.set(true);
    const f = this.form();
    const id = this.applicationId();

    const payload: Partial<Application> = {
      companyName: f.companyName.trim(),
      positionTitle: f.positionTitle.trim(),
      status: f.status,
      dateApplied: f.dateApplied || null,
      companyUrl: f.companyUrl || null,
      jobPostingUrl: f.jobPostingUrl || null,
      companyCareerUrl: f.companyCareerUrl || null,
      companyCategory: (f.companyCategory as CompanyCategory) || null,
      jobSource: (f.jobSource as JobSource) || null,
      skillsMatch: f.skillsMatch ? parseInt(f.skillsMatch, 10) : null,
      coverLetterRequired: f.coverLetterRequired,
      salaryMin: f.salaryMin ? parseInt(f.salaryMin, 10) : null,
      salaryMax: f.salaryMax ? parseInt(f.salaryMax, 10) : null,
      specialRequirements: f.specialRequirements || null,
      notes: f.notes || null,
      offerDueDate: f.offerDueDate || null,
    };

    if (id) {
      this.service.update(id, payload).subscribe({
        next: (updated) => {
          this.application.set(updated);
          const populated = populateFromApplication(updated);
          this.form.set(populated);
          this.snapshot.set(JSON.stringify(populated));
          this.saving.set(false);
        },
        error: (err: unknown) => {
          this.errors.set({ general: err instanceof Error ? err.message : 'Failed to save' });
          this.saving.set(false);
        },
      });
    } else {
      this.service.create(payload).subscribe({
        next: (created) => {
          // Create local stages if any
          const stages = this.localStages();
          const createStages = (index: number) => {
            if (index >= stages.length) {
              // Reset dirty state so canDeactivate guard doesn't block navigation
              this.snapshot.set(JSON.stringify(this.form()));
              void this.router.navigate(['/applications', created.id]);
              return;
            }
            const s = stages[index];
            this.service.addStage(created.id, {
              name: s.name,
              order: s.order,
              isCompleted: s.isCompleted,
            }).subscribe({
              next: () => createStages(index + 1),
              error: () => createStages(index + 1),
            });
          };
          createStages(0);
        },
        error: (err: unknown) => {
          this.errors.set({ general: err instanceof Error ? err.message : 'Failed to save' });
          this.saving.set(false);
        },
      });
    }
  }

  onDiscard() {
    if (!this.isDirty()) {
      const id = this.applicationId();
      if (id && this.application()) {
        const populated = populateFromApplication(this.application()!);
        this.form.set(populated);
        this.snapshot.set(JSON.stringify(populated));
      } else {
        void this.router.navigate(['/']);
      }
      return;
    }
    this.showDiscardConfirm.set(true);
  }

  onConfirmDiscard() {
    this.showDiscardConfirm.set(false);
    const id = this.applicationId();
    if (id && this.application()) {
      const populated = populateFromApplication(this.application()!);
      this.form.set(populated);
      this.snapshot.set(JSON.stringify(populated));
    } else {
      void this.router.navigate(['/']);
    }
  }

  onDelete() {
    this.showDeleteConfirm.set(true);
  }

  onConfirmDelete() {
    const id = this.applicationId();
    if (!id) return;
    this.service.delete(id).subscribe({
      next: () => {
        this.showDeleteConfirm.set(false);
        void this.router.navigate(['/']);
      },
    });
  }

  onArchive() {
    const id = this.applicationId();
    if (!id) return;
    this.service.archive(id).subscribe({
      next: (app) => {
        this.application.set(app);
        const populated = populateFromApplication(app);
        this.form.set(populated);
        this.snapshot.set(JSON.stringify(populated));
      },
    });
  }

  onRestoreFromArchive() {
    const id = this.applicationId();
    if (!id) return;
    this.service.restore(id).subscribe({
      next: (app) => {
        this.application.set(app);
        const populated = populateFromApplication(app);
        this.form.set(populated);
        this.snapshot.set(JSON.stringify(populated));
      },
    });
  }

  onHistoryRestored() {
    const id = this.applicationId();
    if (id) {
      this.loadApplication(id);
    }
  }

  // Interview stage handlers
  onAddStage() {
    const name = this.newStageName().trim();
    if (!name) return;

    const id = this.applicationId();
    if (id) {
      this.service.addStage(id, { name, order: this.nextOrder() }).subscribe({
        next: (app) => {
          this.application.set(app);
          this.newStageName.set('');
          this.showAddStageForm.set(false);
        },
      });
    } else {
      const newStage: InterviewStage = {
        id: crypto.randomUUID(),
        name,
        order: this.nextOrder(),
        isCompleted: false,
        completedDate: null,
        notes: null,
        performanceRating: null,
      };
      this.localStages.update((stages) => [...stages, newStage]);
      this.newStageName.set('');
      this.showAddStageForm.set(false);
    }
  }

  onStartEditStage(stageId: string) {
    const stage = this.sortedStages().find((s) => s.id === stageId);
    if (stage) {
      this.editingStageId.set(stageId);
      this.editStageName.set(stage.name);
    }
  }

  onSaveEditStage(stageId: string) {
    const name = this.editStageName().trim();
    if (!name) return;

    const id = this.applicationId();
    if (id) {
      const existing = this.sortedStages().find((s) => s.id === stageId);
      this.service.updateStage(id, stageId, {
        name,
        order: existing?.order ?? 0,
        isCompleted: existing?.isCompleted ?? false,
      }).subscribe({
        next: (app) => {
          this.application.set(app);
          this.editingStageId.set(null);
        },
      });
    } else {
      this.localStages.update((stages) =>
        stages.map((s) => (s.id === stageId ? { ...s, name } : s))
      );
      this.editingStageId.set(null);
    }
  }

  onDeleteStage(stageId: string) {
    const id = this.applicationId();
    if (id) {
      this.service.removeStage(id, stageId).subscribe({
        next: (app) => this.application.set(app),
      });
    } else {
      this.localStages.update((stages) => stages.filter((s) => s.id !== stageId));
    }
  }

  onToggleStageComplete(stage: InterviewStage) {
    const id = this.applicationId();
    const isCompleted = !stage.isCompleted;
    if (id) {
      this.service.updateStage(id, stage.id, {
        name: stage.name,
        order: stage.order,
        isCompleted,
      }).subscribe({
        next: (app) => this.application.set(app),
      });
    } else {
      this.localStages.update((stages) =>
        stages.map((s) => (s.id === stage.id ? { ...s, isCompleted } : s))
      );
    }
  }
}
