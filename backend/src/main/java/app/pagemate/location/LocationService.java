package app.pagemate.location;

import app.pagemate.location.dto.LocationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LocationService {

    private final RestTemplate restTemplate;

    @Value("${kakao.api-key}")
    private String apiKey;

    @Value("${kakao.local-search-url}")
    private String localSearchUrl;

    @Value("${kakao.reverse-geocode-url}")
    private String reverseGeocodeUrl;

    @SuppressWarnings("unchecked")
    public List<LocationResult> search(String query) {
        String url = localSearchUrl + "?query=" + encodeQuery(query) + "&size=10";
        log.info("[Location] 검색 URL: {}", url);
        ResponseEntity<Map> response = exchange(url);

        if (response.getBody() == null) return Collections.emptyList();

        List<Map<String, Object>> documents = (List<Map<String, Object>>) response.getBody().get("documents");
        log.info("[Location] 카카오 응답 documents 수: {}", documents == null ? "null" : documents.size());
        if (documents == null) return Collections.emptyList();

        return documents.stream()
                .map(doc -> {
                    Map<String, Object> addr = (Map<String, Object>) doc.get("address");
                    Map<String, Object> road = (Map<String, Object>) doc.get("road_address");
                    Map<String, Object> src  = addr != null ? addr : road;
                    if (src == null) return null;
                    String city     = str(src, "region_1depth_name");
                    String district = str(src, "region_2depth_name");
                    String name     = str(src, "region_3depth_name");
                    if (name.isBlank()) name = str(src, "region_3depth_h_name");
                    String full     = str(src, "address_name");
                    log.info("[Location] doc → name={}, district={}, city={}", name, district, city);
                    if (name.isBlank()) return null;
                    return new LocationResult(name, district, city, full);
                })
                .filter(r -> r != null && !r.name().isBlank())
                .distinct()
                .limit(10)
                .collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    public LocationResult reverseGeocode(double lat, double lng) {
        String url = reverseGeocodeUrl + "?x=" + lng + "&y=" + lat;
        ResponseEntity<Map> response = exchange(url);

        if (response.getBody() == null) return null;

        List<Map<String, Object>> documents = (List<Map<String, Object>>) response.getBody().get("documents");
        if (documents == null || documents.isEmpty()) return null;

        Map<String, Object> addr = (Map<String, Object>) documents.get(0).get("address");
        if (addr == null) return null;

        String city = str(addr, "region_1depth_name");
        String district = str(addr, "region_2depth_name");
        String name = str(addr, "region_3depth_name");
        String full = str(addr, "address_name");

        return new LocationResult(name, district, city, full);
    }

    private ResponseEntity<Map> exchange(String url) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "KakaoAK " + apiKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        return restTemplate.exchange(java.net.URI.create(url), HttpMethod.GET, entity, Map.class);
    }

    private String str(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v == null ? "" : v.toString();
    }

    private String encodeQuery(String q) {
        try {
            return java.net.URLEncoder.encode(q, "UTF-8");
        } catch (Exception e) {
            return q;
        }
    }
}
