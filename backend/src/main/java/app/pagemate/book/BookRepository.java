package app.pagemate.book;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookRepository extends JpaRepository<Book, Long> {
    int countByOwnerId(Long ownerId);
    List<Book> findByOwnerIdAndStatus(Long ownerId, BookStatus status);
}
