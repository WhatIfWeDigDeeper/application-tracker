-- 005_align_status_with_nestjs: Align application_status values with NestJS/Angular.
UPDATE go_gin.applications SET status = CASE status
    WHEN 'phone_screen' THEN 'interviewing'
    WHEN 'offer'        THEN 'given offer'
    WHEN 'accepted'     THEN 'accepted offer'
    WHEN 'withdrawn'    THEN NULL
    ELSE status
END;

ALTER TABLE go_gin.applications DROP CONSTRAINT applications_status_check;
ALTER TABLE go_gin.applications
    ADD CONSTRAINT applications_status_check
    CHECK (status IN ('unsubmitted', 'applied', 'interviewing',
                      'given offer', 'accepted offer', 'declined offer',
                      'rejected', 'no offer'));
