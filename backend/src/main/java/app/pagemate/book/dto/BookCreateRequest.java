package app.pagemate.book.dto;

import app.pagemate.book.BookCondition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

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

    @NotNull
    private BookCondition condition;

    @Size(max = 200)
    private String description;

    private String coverColor = "sage";

    private MultipartFile image;
    private String kakaoThumbnailUrl;

    private Double lat;
    private Double lng;
}
