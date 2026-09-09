# Export Recovery

This supplements the [consumer export contract](./mokabook-export.md). The same
rules apply to consumer export and the repository's legacy preview migration.
No new CLI options or supported JavaScript API are introduced.

## Captured Ownership And Installation

1. Validate output ownership and reserve the destination before generation.
   Revalidate ownership and cancellation before moving existing output to backup.
2. Validate the actual captured backup before the stage can be installed. This
   catches unowned files, empty directories, symlinks, special entries, or invalid
   inventories introduced after the first destination check. Missing backups
   also fail. Capturing a path does not itself grant ownership of its contents.
3. On validation, cancellation, or installation failure, restore only a real
   backup directory and only if the destination is still observed as absent.
   Use directory rename without deleting or clearing the destination first.
   A nonempty destination appearing during rename must make recovery fail, not
   be overwritten. Observed empty destinations are also left untouched.
4. If restoration is unsafe or fails, preserve the destination and backup and
   identify the recovery path. Never automatically restore a captured symlink
   or regular file over a destination. A successful restoration preserves all
   captured bytes, including unexpected unowned files, and export still fails.
5. Stage-to-output rename is the commit point. Once started it is drained rather
   than interrupted. A successful rename is never undone solely because later
   backup or reservation cleanup fails.

Ownership remains path-based: the existing inventory authorizes replacement of
its named generated files, not arbitrary new files. A failed operation that never
moved previous output must not claim that it restored a previous export.

## Bounded Cleanup

After installation, validate the backup again and retain that exact validated
file/directory list for deletion. Unlink only those files, remove known child
directories deepest first with non-recursive removal, remove the marker last,
then remove the backup root non-recursively. Do not pass a captured backup to a
recursive removal operation. Unlisted additions during deletion must stop
directory removal and survive for recovery.

Cleanup can partially remove owned files after the commit point. Its error must
say that the new site is installed and identify the remaining backup; it must
not imply that the retained backup is necessarily a complete old site.

Final reservation cleanup uses `lstat` to recognize every existing backup entry,
including dangling symlinks, and refuses to delete it. Only the private generated
stage may be removed recursively. The transaction marker is unlinked individually
and the reservation directory is removed non-recursively, so a backup or other
unowned entry appearing after the initial check cannot be swept away. The owned
parent namespace metadata remains as specified by the export contract.
Retrying cleanup after the reservation is already absent is a successful no-op.

Reservations coordinate Mokabook writers, not unrelated editors. Consumers must
not mutate the private reservation namespace. These checks preserve detected
destination conflicts and late unlisted additions; they are not a claim of
atomic exclusion against hostile changes to arbitrary filesystem ancestors.

## Primary And Cleanup Failures

Use one cleanup policy for partial transaction setup and the export orchestrator:
normal export error categorization occurs before this policy handles that failure.

- Run cleanup once and await it before returning or throwing.
- If only the operation fails, propagate that same error object unchanged.
- If only cleanup fails, propagate that failure and return a nonzero CLI exit.
- If both fail, show the primary failure first, followed by the cleanup
  diagnostic and any recovery path. Use an `export-invalid` error with an
  `AggregateError` cause containing the original primary and cleanup objects,
  in that order. Do not discard a cause chain or treat a thrown `undefined` as
  proof that no failure occurred.
- Cancellation, rollback, backup disposal, and reservation cleanup follow the
  same policy. CLI signal handlers still detach when the operation finishes.

The normal CLI prints actionable combined messages without requiring diagnostic
mode or printing stacks. It never prints the success message when cleanup fails.

## Verification

Tests inject mutations immediately before capture, after capture, during backup
deletion, and during final reservation cleanup. Cover restoration conflicts,
dangling backup links, partial setup, and exact primary/secondary cause identity.
Real subprocess CLI tests must assert exit status and stderr for rollback,
backup-cleanup, cancellation-plus-cleanup, and cleanup-only failures.
