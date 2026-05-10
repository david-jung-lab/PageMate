package app.pagemate.book.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BookCreateRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String author;

    private String publisher;
    private String isbn;

    @NotBlank
    private String genre;

    @Size(max = 200)
    private String description;

    private String coverColor = "sage";

    private String kakaoThumbnailUrl;
}
