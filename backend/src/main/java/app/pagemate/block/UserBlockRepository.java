package app.pagemate.block;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {

    Optional<UserBlock> findByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    boolean existsByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    @Query("SELECT b FROM UserBlock b JOIN FETCH b.blocked " +
           "WHERE b.blocker.id = :userId ORDER BY b.createdAt DESC")
    List<UserBlock> findAllByBlockerId(@Param("userId") Long userId);

    /** 내가 차단한 사용자 */
    @Query("SELECT b.blocked.id FROM UserBlock b WHERE b.blocker.id = :userId")
    List<Long> findBlockedIdsByBlockerId(@Param("userId") Long userId);

    /** 나를 차단한 사용자 */
    @Query("SELECT b.blocker.id FROM UserBlock b WHERE b.blocked.id = :userId")
    List<Long> findBlockerIdsByBlockedId(@Param("userId") Long userId);

    /** 두 사용자 사이에 어느 방향으로든 차단이 있는지 */
    @Query("SELECT COUNT(b) > 0 FROM UserBlock b " +
           "WHERE (b.blocker.id = :userId AND b.blocked.id = :otherId) " +
           "   OR (b.blocker.id = :otherId AND b.blocked.id = :userId)")
    boolean existsBetween(@Param("userId") Long userId, @Param("otherId") Long otherId);
}
