package app.pagemate.reading.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class ReadingRecordRequest {

    @NotBlank
    @Size(max = 200)
    private String bookTitle;

    @NotBlank
    @Size(max = 100)
    private String author;

    @Size(max = 20)
    private String isbn;

    @NotNull
    @Min(1) @Max(5)
    private Integer rating;

    private String memo;

    private String imageUrl;

    @Size(max = 20)
    private String coverColor;

    private Boolean isPublic;

    @NotNull
    private LocalDate readAt;
}
