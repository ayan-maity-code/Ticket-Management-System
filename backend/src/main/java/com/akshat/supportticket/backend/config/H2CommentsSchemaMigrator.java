package com.akshat.supportticket.backend.config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Normalizes legacy {@code comments} tables: drops unused {@code comment_text} when {@code text} is the
 * active column, or copies {@code comment_text} into {@code text} when only the new column existed.
 */
@Component
public class H2CommentsSchemaMigrator {

    private static final Logger log = LoggerFactory.getLogger(H2CommentsSchemaMigrator.class);

    private final JdbcTemplate jdbcTemplate;
    private final DataSourceProperties dataSourceProperties;

    public H2CommentsSchemaMigrator(JdbcTemplate jdbcTemplate, DataSourceProperties dataSourceProperties) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSourceProperties = dataSourceProperties;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void migrateCommentsTable() {
        String url = dataSourceProperties.getUrl();
        if (url == null || !url.contains(":h2:")) {
            return;
        }

        Set<String> columns = resolveCommentsColumns();
        if (columns.isEmpty()) {
            return;
        }

        boolean hasText = columns.contains("TEXT");
        boolean hasCommentText = columns.contains("COMMENT_TEXT");

        if (hasText && hasCommentText) {
            log.info("Dropping legacy comments.comment_text column (using comments.text)");
            jdbcTemplate.execute("UPDATE comments SET text = comment_text WHERE text IS NULL AND comment_text IS NOT NULL");
            jdbcTemplate.execute("ALTER TABLE comments DROP COLUMN IF EXISTS comment_text");
            return;
        }

        if (!hasText && hasCommentText) {
            log.info("Renaming comments.comment_text to comments.text");
            jdbcTemplate.execute("ALTER TABLE comments ADD COLUMN IF NOT EXISTS text CHARACTER LARGE OBJECT");
            jdbcTemplate.execute("UPDATE comments SET text = comment_text WHERE text IS NULL");
            jdbcTemplate.execute("ALTER TABLE comments DROP COLUMN IF EXISTS comment_text");
        }
    }

    private Set<String> resolveCommentsColumns() {
        for (String table : List.of("COMMENTS", "comments")) {
            Set<String> columns = columnNames(table);
            if (!columns.isEmpty()) {
                return columns;
            }
        }
        return Set.of();
    }

    private Set<String> columnNames(String tableName) {
        Set<String> names = new HashSet<>();
        try (Connection connection = jdbcTemplate.getDataSource().getConnection()) {
            DatabaseMetaData meta = connection.getMetaData();
            try (ResultSet rs = meta.getColumns(null, null, tableName, null)) {
                while (rs.next()) {
                    names.add(rs.getString("COLUMN_NAME").toUpperCase());
                }
            }
        } catch (Exception ex) {
            log.debug("Could not read metadata for table {}: {}", tableName, ex.getMessage());
        }
        return names;
    }
}
