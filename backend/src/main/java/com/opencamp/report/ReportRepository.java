package com.opencamp.report;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ReportRepository extends JpaRepository<Report, Long> {

    record AdminView(Long id, Long campsiteId, String campsiteName, Report.Reason reason, String description,
                     Report.Status status, Long reportedBy, java.time.Instant createdAt, java.time.Instant resolvedAt) {}

    @Query("""
            select new com.opencamp.report.ReportRepository$AdminView(
                r.id, c.id, c.name, r.reason, r.description, r.status, r.reportedBy, r.createdAt, r.resolvedAt)
            from Report r join Campsite c on c.id = r.campsiteId
            where :status is null or r.status = :status
            order by r.createdAt
            """)
    List<AdminView> findForAdmin(Report.Status status);
}
