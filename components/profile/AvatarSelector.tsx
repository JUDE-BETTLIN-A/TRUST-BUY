"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RefreshCw, Upload, Camera } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const AVATAR_STYLES = [
    { id: "avataaars", name: "Fun" },
    { id: "bottts", name: "Robot" },
    { id: "lorelei", name: "Artistic" },
    { id: "notionists", name: "Sketch" },
    { id: "micah", name: "Modern" },
    { id: "initials", name: "Initials" },
    { id: "adventurer", name: "Adventurer" },
    { id: "big-ears", name: "Big Ears" },
    { id: "croodles", name: "Croodles" },
    { id: "open-peeps", name: "Peeps" },
    { id: "personas", name: "Personas" },
    { id: "pixel-art", name: "Pixel" },
    { id: "thumbs", name: "Thumbs" }
];

interface AvatarSelectorProps {
    currentAvatar: string;
    onSave: (url: string, name?: string) => void;
    userName?: string;
}

export function AvatarSelector({ currentAvatar, onSave, userName = "User" }: AvatarSelectorProps) {
    const [selectedTab, setSelectedTab] = useState("templates");
    const [selectedStyle, setSelectedStyle] = useState("avataaars");
    const [avatarSeed, setAvatarSeed] = useState(userName); // Decoupled seed for generation
    const [inputName, setInputName] = useState(userName); // Separate state for name input
    const [previewUrl, setPreviewUrl] = useState(currentAvatar);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

    // Sync input name if userName prop changes
    useEffect(() => {
        if (userName && userName !== "User") {
            setInputName(userName);
            // We only set avatarSeed if it's the initial load to match the name once
            if (avatarSeed === "User") {
                setAvatarSeed(userName);
            }
        }
    }, [userName]);

    // Generate preview based on style and seed ONLY (not name input)
    useEffect(() => {
        if (selectedTab === "templates") {
            const url = `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${encodeURIComponent(avatarSeed)}`;
            setPreviewUrl(url);
        }
    }, [selectedStyle, avatarSeed, selectedTab]);

    const handleRandomize = () => {
        setIsAnimating(true);
        setAvatarSeed(Math.random().toString(36).substring(7));
        setTimeout(() => setIsAnimating(false), 500);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        onSave(previewUrl, inputName);
    };

    return (
        <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Live Preview */}
            <div className="w-full md:w-1/3 flex flex-col items-center gap-4">
                <div className="relative group">
                    <div className="w-40 h-40 rounded-full border-4 border-white dark:border-gray-700 shadow-2xl overflow-hidden bg-white dark:bg-gray-800 relative z-10 transition-transform transform group-hover:scale-105">
                        {previewUrl ? (
                            <Image
                                src={previewUrl}
                                alt="Avatar Preview"
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                <Camera className="w-12 h-12" />
                            </div>
                        )}
                    </div>
                    {/* Decorative Ring */}
                    <div className="absolute inset-0 rounded-full border border-primary/30 scale-110 -z-0 animate-pulse-slow"></div>
                </div>
                <p className="text-sm font-medium text-gray-500">Preview</p>

                <Button
                    onClick={handleSave}
                    className="w-full rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                >
                    Save New Look
                </Button>
            </div>

            {/* Controls */}
            <div className="w-full md:w-2/3">
                <Tabs defaultValue="templates" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 rounded-xl h-12 mb-6">
                        <TabsTrigger value="templates" className="rounded-lg text-sm font-semibold">Use Templates</TabsTrigger>
                        <TabsTrigger value="upload" className="rounded-lg text-sm font-semibold">Upload Your Own</TabsTrigger>
                    </TabsList>

                    <TabsContent value="templates" className="space-y-6 animate-fade-in">

                        <div className="grid grid-cols-2 gap-4">
                            {/* Main Styles - Display first 3 */}
                            {AVATAR_STYLES.slice(0, 3).map((style) => (
                                <button
                                    key={style.id}
                                    onClick={() => setSelectedStyle(style.id)}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedStyle === style.id
                                        ? "border-primary bg-primary/5 shadow-inner"
                                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-full overflow-hidden relative">
                                        <Image
                                            src={`https://api.dicebear.com/7.x/${style.id}/svg?seed=preview`}
                                            alt={style.name}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                    <span className={`text-xs font-semibold ${selectedStyle === style.id ? "text-primary" : "text-gray-500"}`}>
                                        {style.name}
                                    </span>
                                </button>
                            ))}

                            {/* 'More Options' block that opens Dialog */}
                            <Dialog open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen}>
                                <DialogTrigger asChild>
                                    <button
                                        className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center gap-2 transition-all hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-primary/50 group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                            <span className="material-symbols-outlined text-gray-500 group-hover:text-primary">add</span>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-500 group-hover:text-primary">More Options</span>
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Choose an Avatar Style</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-4 max-h-[400px] overflow-y-auto p-1">
                                        {AVATAR_STYLES.map((style) => (
                                            <button
                                                key={style.id}
                                                onClick={() => {
                                                    setSelectedStyle(style.id);
                                                    setIsTemplatesOpen(false);
                                                }}
                                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedStyle === style.id
                                                    ? "border-primary bg-primary/5 shadow-inner ring-2 ring-primary/20"
                                                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                    }`}
                                            >
                                                <div className="w-12 h-12 rounded-full overflow-hidden relative">
                                                    <Image
                                                        src={`https://api.dicebear.com/7.x/${style.id}/svg?seed=preview`}
                                                        alt={style.name}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                </div>
                                                <span className={`text-xs font-semibold ${selectedStyle === style.id ? "text-primary dark:text-primary" : "text-gray-600 dark:text-gray-400"}`}>
                                                    {style.name}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-end gap-3 mt-6">
                                        <Button variant="outline" onClick={() => setIsTemplatesOpen(false)} className="rounded-xl">
                                            Cancel
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="flex gap-2 items-end">
                            <div className="flex-1 space-y-2">
                                <Label>Change User Name</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={inputName}
                                        onChange={(e) => setInputName(e.target.value)}
                                        placeholder="Type your name..."
                                        className="rounded-xl border-gray-200 dark:border-gray-700 font-medium"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleRandomize}
                                        className={`rounded-xl border-gray-200 dark:border-gray-700 transition-transform ${isAnimating ? 'rotate-180' : ''}`}
                                    >
                                        <RefreshCw className="w-4 h-4 text-gray-600" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="upload" className="animate-fade-in py-4">
                        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4 hover:border-primary/50 transition-colors bg-gray-50/50 dark:bg-gray-800/20">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                                <Upload className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Upload a photo</h3>
                                <p className="text-sm text-gray-500 mt-1">JPG, PNG or GIF (Max 2MB)</p>
                            </div>
                            <Input
                                id="picture"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                            <Button asChild variant="outline" className="rounded-xl mt-2 font-semibold">
                                <label htmlFor="picture" className="cursor-pointer">
                                    Choose File
                                </label>
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
