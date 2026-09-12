import CheckBoxOutlineBlankRoundedIcon from "@mui/icons-material/CheckBoxOutlineBlankRounded";
import CheckBoxRoundedIcon from "@mui/icons-material/CheckBoxRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import {
  Autocomplete,
  Box,
  Checkbox,
  CircularProgress,
  createFilterOptions,
  TextField,
  Typography,
} from "@mui/material";
import type { LibraryDocument } from "../api";

interface DocumentPickerProps {
  documents: LibraryDocument[];
  selected: LibraryDocument[];
  onChange: (documents: LibraryDocument[]) => void;
  loading: boolean;
  disabled?: boolean;
}

const uncheckedIcon = <CheckBoxOutlineBlankRoundedIcon fontSize="small" />;
const checkedIcon = <CheckBoxRoundedIcon fontSize="small" />;
const filterDocuments = createFilterOptions<LibraryDocument>({
  limit: 100,
  stringify: (document) =>
    `${document.title} ${document.source} ${document.document_id}`,
});

export function DocumentPicker({
  documents,
  selected,
  onChange,
  loading,
  disabled = false,
}: DocumentPickerProps) {
  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      filterSelectedOptions={false}
      limitTags={2}
      options={documents}
      filterOptions={filterDocuments}
      value={selected}
      loading={loading}
      disabled={disabled}
      onChange={(_, value) => onChange(value)}
      getOptionLabel={(document) => document.title}
      getOptionDisabled={(option) =>
        selected.length >= 20 &&
        !selected.some((item) => item.document_id === option.document_id)
      }
      isOptionEqualToValue={(option, value) =>
        option.document_id === value.document_id
      }
      noOptionsText={loading ? "Opening the catalog…" : "No matching books"}
      getLimitTagsText={(more) => `+${more} more`}
      slotProps={{
        paper: { className: "document-picker-paper" },
        listbox: { sx: { maxHeight: 320 } },
      }}
      renderOption={(props, option, state) => {
        const { key, ...optionProps } = props;
        return (
          <Box component="li" key={key} {...optionProps} className="document-option">
            <Checkbox
              icon={uncheckedIcon}
              checkedIcon={checkedIcon}
              checked={state.selected}
              tabIndex={-1}
              size="small"
            />
            <MenuBookRoundedIcon className="document-option-icon" />
            <Box minWidth={0}>
              <Typography variant="body2" fontWeight={700} noWrap>
                {option.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap component="div">
                {option.page_count} pages · ID {option.document_id.slice(0, 8)}…
              </Typography>
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          placeholder={selected.length ? "Attach another book…" : "Search and attach books…"}
          helperText={
            selected.length >= 20
              ? "Maximum 20 books per question"
              : undefined
          }
          aria-label="Attach books to this question"
          slotProps={{
            input: {
              ...params.InputProps,
              startAdornment: (
                <>
                  <MenuBookRoundedIcon className="picker-leading-icon" />
                  {params.InputProps.startAdornment}
                </>
              ),
              endAdornment: (
                <>
                  {loading && <CircularProgress color="inherit" size={16} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}
