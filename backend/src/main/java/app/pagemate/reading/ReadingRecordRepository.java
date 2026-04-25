package app.pagemate.reading;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReadingRecordRepository extends JpaRepository<ReadingRecord, Long> {

    Page<ReadingRecord> findByUserIdOrderByReadAtDesc(Long userId, Pageable pageable);

    Page<ReadingRecord> findByUserIdAndIsPublicTrueOrderByReadAtDesc(Long userId, Pageable pageable);

    int countByUserId(Long userId);
}
