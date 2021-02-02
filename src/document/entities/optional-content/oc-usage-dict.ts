import { Dict } from "../core/dict";
import { CreatoInfoDict } from "./misc/creator-info-dict";
import { ExportDict } from "./misc/export-dict";
import { LanguageDict } from "./misc/language-dict";
import { PageElementDict } from "./misc/page-element-dict";
import { PrintDict } from "./misc/print-dict";
import { UserDict } from "./misc/user-dict";
import { ViewDict } from "./misc/view-dict";
import { ZoomDict } from "./misc/zoom-dict";

export class OcUsageDict extends Dict {
  /**
   * (Optional) A dictionary used by the creating application 
   * to store application-specific data associated with this optional content group
   */
  CreatorInfo: CreatoInfoDict; 
  /**
   * (Optional) A dictionary specifying the language of the content 
   * controlled by this optional content group
   */
  Language: LanguageDict; 
  /**
   * (Optional) A dictionary containing one entry 
   * which shall indicate the recommended state for content in this group 
   * when the document (or part of it) is saved by a conforming reader 
   * to a format that does not support optional content (for example, a raster image format)
   */
  Export: ExportDict; 
  /**
   * (Optional) A dictionary specifying a range of magnifications 
   * at which the content in this optional content group is best viewed
   */
  Zoom: ZoomDict; 
  /**
   * (Optional) A dictionary specifying that the content in this group 
   * is shall be used when printing
   */
  Print: PrintDict; 
  /**(Optional) A dictionary that shall have a single entry 
   * indicating that the group shall be set to that state 
   * when the document is opened in a conforming reader
   */
  View: ViewDict; 
  /**
   * (Optional) A dictionary specifying one or more users 
   * for whom this optional content group is primarily intended
   */
  User: UserDict; 
  /**
   * (Optional) A dictionary declaring that the group contains a pagination artifact
   */
  PageElement: PageElementDict; 
  
  constructor() {
    super(null);
  }
}
