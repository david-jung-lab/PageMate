package app.pagemate.reading;

import app.pagemate.book.dto.BookPageResponse;
import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import app.pagemate.reading.dto.ReadingRecordRequest;
import app.pagemate.reading.dto.ReadingRecordResponse;
import app.pagemate.user.User;
import app.pagemate.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReadingRecordService {

    private final ReadingRecordRepository recordRepository;
    private final UserRepository userRepository;

    public BookPageResponse<ReadingRecordResponse> getMyRecords(Long userId, int page, int size) {
        return BookPageResponse.of(
                recordRepository.findByUserIdOrderByReadAtDesc(userId, PageRequest.of(page, size)),
                ReadingRecordResponse::of
        );
    }

    public BookPageResponse<ReadingRecordResponse> getUserRecords(Long targetId, int page, int size) {
        if (!userRepository.existsById(targetId)) {
            throw new PagemateException(ErrorCode.USER_NOT_FOUND);
        }
        return BookPageResponse.of(
                recordRepository.findByUserIdAndIsPublicTrueOrderByReadAtDesc(targetId, PageRequest.of(page, size)),
                ReadingRecordResponse::of
        );
    }

    @Transactional
    public ReadingRecordResponse create(Long userId, ReadingRecordRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));

        ReadingRecord record = ReadingRecord.builder()
                .user(user)
                .bookTitle(req.getBookTitle())
                .author(req.getAuthor())
                .isbn(req.getIsbn())
                .rating(req.getRating())
                .memo(req.getMemo())
                .imageUrl(req.getImageUrl())
                .coverColor(req.getCoverColor() != null ? req.getCoverColor() : "blue")
                .isPublic(req.getIsPublic() != null ? req.getIsPublic() : true)
                .readAt(req.getReadAt())
                .build();

        return ReadingRecordResponse.of(recordRepository.save(record));
    }

    @Transactional
    public ReadingRecordResponse update(Long userId, Long recordId, ReadingRecordRequest req) {
        ReadingRecord record = findAndVerifyOwner(userId, recordId);
        record.update(
                req.getBookTitle(), req.getAuthor(), req.getIsbn(),
                req.getRating(), req.getMemo(), req.getImageUrl(),
                req.getCoverColor(), req.getIsPublic(), req.getReadAt()
        );
        return ReadingRecordResponse.of(record);
    }

    @Transactional
    public void delete(Long userId, Long recordId) {
        ReadingRecord record = findAndVerifyOwner(userId, recordId);
        recordRepository.delete(record);
    }

    private ReadingRecord findAndVerifyOwner(Long userId, Long recordId) {
        ReadingRecord record = recordRepository.findById(recordId)
                .orElseThrow(() -> new PagemateException(ErrorCode.READING_RECORD_NOT_FOUND));
        if (!record.getUser().getId().equals(userId)) {
            throw new PagemateException(ErrorCode.READING_RECORD_ACCESS_DENIED);
        }
        return record;
    }
}
